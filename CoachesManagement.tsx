import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { coachesApi } from '@/db/api';
import type { Coach } from '@/types/types';

export default function CoachesManagement() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    hourly_rate: '',
    bio: '',
    specialties: '',
    status: 'available'
  });

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      const data = await coachesApi.getAll();
      setCoaches(data);
    } catch (error) {
      console.error('Failed to load coaches:', error);
      toast.error('Failed to load coaches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (coach?: Coach) => {
    if (coach) {
      setEditingCoach(coach);
      setFormData({
        name: coach.name,
        hourly_rate: coach.hourly_rate.toString(),
        bio: coach.bio || '',
        specialties: coach.specialties?.join(', ') || '',
        status: coach.status
      });
    } else {
      setEditingCoach(null);
      setFormData({
        name: '',
        hourly_rate: '',
        bio: '',
        specialties: '',
        status: 'available'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const coachData = {
        name: formData.name,
        hourly_rate: parseFloat(formData.hourly_rate),
        bio: formData.bio || null,
        specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : null,
        status: formData.status
      };

      if (editingCoach) {
        await coachesApi.update(editingCoach.id, coachData);
        toast.success('Coach updated successfully');
      } else {
        await coachesApi.create(coachData);
        toast.success('Coach created successfully');
      }

      setIsDialogOpen(false);
      await loadCoaches();
    } catch (error) {
      console.error('Failed to save coach:', error);
      toast.error('Failed to save coach');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coach?')) return;

    try {
      await coachesApi.delete(id);
      toast.success('Coach deleted successfully');
      await loadCoaches();
    } catch (error) {
      console.error('Failed to delete coach:', error);
      toast.error('Failed to delete coach');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Coaches Management</CardTitle>
            <CardDescription>Manage coaches and their availability</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Coach
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCoach ? 'Edit Coach' : 'Add New Coach'}</DialogTitle>
                <DialogDescription>
                  {editingCoach ? 'Update coach information' : 'Create a new coach'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate *</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                  <Input
                    id="specialties"
                    value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                    placeholder="e.g., Badminton, Tennis, Coaching"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Hourly Rate</TableHead>
              <TableHead>Specialties</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coaches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No coaches found
                </TableCell>
              </TableRow>
            ) : (
              coaches.map((coach) => (
                <TableRow key={coach.id}>
                  <TableCell className="font-medium">{coach.name}</TableCell>
                  <TableCell>${coach.hourly_rate}/hr</TableCell>
                  <TableCell>
                    {coach.specialties?.map((s, i) => (
                      <Badge key={i} variant="outline" className="mr-1">
                        {s}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coach.status === 'available' ? 'default' : 'secondary'}>
                      {coach.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(coach)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(coach.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
