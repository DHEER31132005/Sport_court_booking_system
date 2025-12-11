import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { pricingRulesApi } from '@/db/api';
import type { PricingRule, RuleType } from '@/types/types';

export default function PricingRulesManagement() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    rule_type: 'peak_hour' as RuleType,
    start_time: '',
    end_time: '',
    days_of_week: [] as number[],
    multiplier: '1.0',
    surcharge: '0',
    is_active: true
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await pricingRulesApi.getAll();
      setRules(data);
    } catch (error) {
      console.error('Failed to load pricing rules:', error);
      toast.error('Failed to load pricing rules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (rule?: PricingRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        rule_type: rule.rule_type,
        start_time: rule.start_time || '',
        end_time: rule.end_time || '',
        days_of_week: rule.days_of_week || [],
        multiplier: rule.multiplier.toString(),
        surcharge: rule.surcharge.toString(),
        is_active: rule.is_active
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        rule_type: 'peak_hour',
        start_time: '',
        end_time: '',
        days_of_week: [],
        multiplier: '1.0',
        surcharge: '0',
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ruleData = {
        name: formData.name,
        rule_type: formData.rule_type,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        days_of_week: formData.days_of_week.length > 0 ? formData.days_of_week : null,
        multiplier: parseFloat(formData.multiplier),
        surcharge: parseFloat(formData.surcharge),
        is_active: formData.is_active
      };

      if (editingRule) {
        await pricingRulesApi.update(editingRule.id, ruleData);
        toast.success('Pricing rule updated successfully');
      } else {
        await pricingRulesApi.create(ruleData);
        toast.success('Pricing rule created successfully');
      }

      setIsDialogOpen(false);
      await loadRules();
    } catch (error) {
      console.error('Failed to save pricing rule:', error);
      toast.error('Failed to save pricing rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    try {
      await pricingRulesApi.delete(id);
      toast.success('Pricing rule deleted successfully');
      await loadRules();
    } catch (error) {
      console.error('Failed to delete pricing rule:', error);
      toast.error('Failed to delete pricing rule');
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
            <CardTitle>Pricing Rules Management</CardTitle>
            <CardDescription>Manage dynamic pricing rules and modifiers</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Edit Pricing Rule' : 'Add New Pricing Rule'}</DialogTitle>
                <DialogDescription>
                  {editingRule ? 'Update pricing rule' : 'Create a new pricing rule'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule_type">Rule Type *</Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={(value: RuleType) => setFormData({ ...formData, rule_type: value })}
                  >
                    <SelectTrigger id="rule_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peak_hour">Peak Hour</SelectItem>
                      <SelectItem value="weekend">Weekend</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="premium_court">Premium Court</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex gap-2 flex-wrap">
                    {dayNames.map((day, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant={formData.days_of_week.includes(index) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleDayOfWeek(index)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="multiplier">Multiplier *</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.multiplier}
                      onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surcharge">Surcharge *</Label>
                    <Input
                      id="surcharge"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.surcharge}
                      onChange={(e) => setFormData({ ...formData, surcharge: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
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
              <TableHead>Type</TableHead>
              <TableHead>Time Range</TableHead>
              <TableHead>Multiplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No pricing rules found
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.rule_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {rule.start_time && rule.end_time
                      ? `${rule.start_time} - ${rule.end_time}`
                      : '-'}
                  </TableCell>
                  <TableCell>{rule.multiplier}x</TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
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
