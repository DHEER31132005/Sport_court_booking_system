import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { equipmentApi } from '@/db/api';
import type { Equipment } from '@/types/types';

export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    total_stock: '',
    available_count: '',
    rental_price: ''
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await equipmentApi.getAll();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to load equipment:', error);
      toast.error('Failed to load equipment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (equip: Equipment) => {
    setEditingEquipment(equip);
    setFormData({
      total_stock: equip.total_stock.toString(),
      available_count: equip.available_count.toString(),
      rental_price: equip.rental_price.toString()
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;

    setIsSubmitting(true);

    try {
      await equipmentApi.update(editingEquipment.id, {
        total_stock: parseInt(formData.total_stock),
        available_count: parseInt(formData.available_count),
        rental_price: parseFloat(formData.rental_price)
      });

      toast.success('Equipment updated successfully');
      setIsDialogOpen(false);
      await loadEquipment();
    } catch (error) {
      console.error('Failed to update equipment:', error);
      toast.error('Failed to update equipment');
    } finally {
      setIsSubmitting(false);
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
        <CardTitle>Equipment Management</CardTitle>
        <CardDescription>Manage equipment inventory and rental prices</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Rental Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No equipment found
                </TableCell>
              </TableRow>
            ) : (
              equipment.map((equip) => (
                <TableRow key={equip.id}>
                  <TableCell className="font-medium capitalize">{equip.type}</TableCell>
                  <TableCell>{equip.total_stock}</TableCell>
                  <TableCell>
                    <Badge variant={equip.available_count > 0 ? 'default' : 'destructive'}>
                      {equip.available_count}
                    </Badge>
                  </TableCell>
                  <TableCell>${equip.rental_price}</TableCell>
                  <TableCell className="text-right">
                    <Dialog open={isDialogOpen && editingEquipment?.id === equip.id} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(equip)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Equipment</DialogTitle>
                          <DialogDescription>
                            Update inventory and pricing for {equip.type}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="total_stock">Total Stock *</Label>
                            <Input
                              id="total_stock"
                              type="number"
                              min="0"
                              value={formData.total_stock}
                              onChange={(e) => setFormData({ ...formData, total_stock: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="available_count">Available Count *</Label>
                            <Input
                              id="available_count"
                              type="number"
                              min="0"
                              max={formData.total_stock}
                              value={formData.available_count}
                              onChange={(e) => setFormData({ ...formData, available_count: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rental_price">Rental Price *</Label>
                            <Input
                              id="rental_price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.rental_price}
                              onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })}
                              required
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
