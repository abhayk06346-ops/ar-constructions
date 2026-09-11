"use client";

import { useState, useEffect } from 'react';
import { Card, Button, Modal, DataTable, Badge, Input, Select, PageHeader, ConfirmDialog, Tabs } from '@/components/ui';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

// Helper if not in utils
const getEquipmentCategoryLabel = (category: string) => {
  const map: Record<string, string> = {
    excavator: 'Excavator',
    crane: 'Crane',
    mixer: 'Concrete Mixer',
    compactor: 'Compactor',
    scaffolding: 'Scaffolding',
    pump: 'Water Pump',
    generator: 'Generator',
    truck: 'Truck/Dumper',
    other: 'Other'
  };
  return map[category] || category;
};

interface Project {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  category: string;
  vendorId: string | null;
  dailyRate: number;
  status: string;
  notes: string | null;
  assignments: any[];
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEquipmentForAssign, setSelectedEquipmentForAssign] = useState<Equipment | null>(null);
  const [assignFormData, setAssignFormData] = useState({
    projectId: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [activeAssignmentForReturn, setActiveAssignmentForReturn] = useState<any>(null);
  const [returnEndDate, setReturnEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'owned',
    category: 'excavator',
    dailyRate: 0,
    status: 'available',
    notes: '',
  });

  useEffect(() => {
    fetchEquipment();
    fetchProjects();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/equipment');
      const data = await res.json();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to fetch equipment', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };

  const handleOpenModal = (eq?: Equipment) => {
    if (eq) {
      setEditingEquipment(eq);
      setFormData({
        name: eq.name,
        type: eq.type,
        category: eq.category,
        dailyRate: eq.dailyRate / 100, // convert from paise
        status: eq.status,
        notes: eq.notes || '',
      });
    } else {
      setEditingEquipment(null);
      setFormData({
        name: '',
        type: 'owned',
        category: 'excavator',
        dailyRate: 0,
        status: 'available',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEquipment ? `/api/equipment/${editingEquipment.id}` : '/api/equipment';
      const method = editingEquipment ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        dailyRate: Math.round(formData.dailyRate * 100), // convert to paise
      };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      setIsModalOpen(false);
      fetchEquipment();
    } catch (error) {
      console.error('Failed to save equipment', error);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentForAssign) return;
    
    try {
      await fetch('/api/equipment/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: selectedEquipmentForAssign.id,
          ...assignFormData
        }),
      });
      setIsAssignModalOpen(false);
      fetchEquipment();
    } catch (error) {
      console.error('Failed to assign equipment', error);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentForReturn) return;
    
    try {
      await fetch(`/api/equipment/assignments/${activeAssignmentForReturn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endDate: returnEndDate
        }),
      });
      setIsReturnModalOpen(false);
      fetchEquipment();
    } catch (error) {
      console.error('Failed to return equipment', error);
    }
  };

  const filteredEquipment = equipment.filter(eq => {
    if (activeTab === 'all') return true;
    if (activeTab === 'available') return eq.status === 'available';
    if (activeTab === 'in_use') return eq.status === 'in_use';
    if (activeTab === 'maintenance') return eq.status === 'maintenance';
    return true;
  });

  const columns = [
    { key: 'name', label: 'Name' },
    { 
      key: 'category', 
      label: 'Category',
      render: (eq: Equipment) => getEquipmentCategoryLabel(eq.category)
    },
    { 
      key: 'type', 
      label: 'Type',
      render: (eq: Equipment) => <Badge variant={eq.type === 'owned' ? 'neutral' : 'warning'}>{eq.type}</Badge>
    },
    { 
      key: 'dailyRate', 
      label: 'Daily Rate',
      render: (eq: Equipment) => formatCurrency(eq.dailyRate)
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (eq: Equipment) => <Badge variant={eq.status === 'available' ? 'success' : eq.status === 'in_use' ? 'info' : 'warning'}>{eq.status.replace('_', ' ')}</Badge>
    },
    { 
      key: 'currentSite', 
      label: 'Current Site',
      render: (eq: Equipment) => {
        if (eq.status === 'in_use' && eq.assignments && eq.assignments.length > 0) {
          const active = eq.assignments.find(a => !a.endDate);
          return active ? active.project.name : '-';
        }
        return '-';
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (eq: Equipment) => (
        <div className="flex space-x-2">
          {eq.status === 'available' && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedEquipmentForAssign(eq); setIsAssignModalOpen(true); }}>Assign</Button>
          )}
          {eq.status === 'in_use' && (
            <Button size="sm" variant="secondary" onClick={(e) => { 
              e.stopPropagation(); 
              const active = eq.assignments?.find(a => !a.endDate);
              if (active) {
                setActiveAssignmentForReturn(active);
                setIsReturnModalOpen(true);
              }
            }}>Return</Button>
          )}
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleOpenModal(eq); }}>Edit</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Equipment" 
        action={<Button onClick={() => handleOpenModal()}>Add Equipment</Button>}
      />

      <Card>
        <div className="mb-4">
          <Tabs 
            tabs={[
              { key: 'all', label: 'All Equipment' },
              { key: 'available', label: 'Available' },
              { key: 'in_use', label: 'In Use' },
              { key: 'maintenance', label: 'Maintenance' },
            ]} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredEquipment} 
            emptyMessage="No equipment found"
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEquipment ? "Edit Equipment" : "Add Equipment"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            
          />
          <Select 
            label="Category" 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})} 
            options={[
              { value: 'excavator', label: 'Excavator' },
              { value: 'crane', label: 'Crane' },
              { value: 'mixer', label: 'Concrete Mixer' },
              { value: 'compactor', label: 'Compactor' },
              { value: 'scaffolding', label: 'Scaffolding' },
              { value: 'pump', label: 'Water Pump' },
              { value: 'generator', label: 'Generator' },
              { value: 'truck', label: 'Truck/Dumper' },
              { value: 'other', label: 'Other' },
            ]}
           
          />
          <Select 
            label="Type" 
            value={formData.type} 
            onChange={(e) => setFormData({...formData, type: e.target.value})} 
            options={[
              { value: 'owned', label: 'Owned' },
              { value: 'rented', label: 'Rented' },
            ]}
           
          />
          <Input 
            label="Daily Rate (₹)" 
            type="number"
            value={formData.dailyRate} 
            onChange={(e) => setFormData({...formData, dailyRate: Number(e.target.value)})} 
            
          />
          <Select 
            label="Status" 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})} 
            options={[
              { value: 'available', label: 'Available' },
              { value: 'in_use', label: 'In Use' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'retired', label: 'Retired' },
            ]}
           
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign ${selectedEquipmentForAssign?.name} to Site`}
        size="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <Select 
            label="Project" 
            value={assignFormData.projectId} 
            onChange={(e) => setAssignFormData({...assignFormData, projectId: e.target.value})} 
            options={projects.map(p => ({ value: p.id, label: p.name }))}
           
          />
          <Input 
            label="Start Date" 
            type="date"
            value={assignFormData.startDate} 
            onChange={(e) => setAssignFormData({...assignFormData, startDate: e.target.value})} 
            
          />
          <Input 
            label="Notes" 
            value={assignFormData.notes} 
            onChange={(e) => setAssignFormData({...assignFormData, notes: e.target.value})} 
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title={`Return Equipment from Site`}
        size="md"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Returning from: <span className="font-semibold">{activeAssignmentForReturn?.project?.name}</span><br />
            Dispatched on: <span className="font-semibold">{formatDate(activeAssignmentForReturn?.startDate)}</span>
          </p>
          <Input 
            label="Return Date" 
            type="date"
            value={returnEndDate} 
            onChange={(e) => setReturnEndDate(e.target.value)} 
            
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
            <Button type="submit">Complete Return</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
