"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Modal, Badge, Input, Select, TextArea, Tabs, DataTable, StatCard, ConfirmDialog } from '@/components/ui';
import { formatCurrency, formatDate, getStatusColor, getDelayReasonLabel } from '@/lib/utils';

export default function ProjectDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isCOModalOpen, setIsCOModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  
  const [selectedPhase, setSelectedPhase] = useState<any>(null);

  // Form states
  const [projectForm, setProjectForm] = useState<any>({});
  const [phaseForm, setPhaseForm] = useState({ id: '', name: '', status: 'pending', progress: 0, startDate: '', endDate: '' });
  const [coForm, setCoForm] = useState({ title: '', reason: '', additionalCost: '', additionalDays: '', status: 'pending' });
  const [delayForm, setDelayForm] = useState({ reason: 'weather', startDate: '', endDate: '', description: '' });

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setProjectForm({
          name: data.name, status: data.status, expectedEndDate: data.expectedEndDate.split('T')[0]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      });
      if (res.ok) {
        setIsEditProjectOpen(false);
        fetchProject();
      }
    } catch (err) {}
  };

  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedPhase ? `/api/projects/${id}/phases/${selectedPhase.id}` : `/api/projects/${id}/phases`;
      const method = selectedPhase ? 'PUT' : 'POST';
      const payload = {
        ...phaseForm,
        progress: parseInt(phaseForm.progress.toString()),
        startDate: phaseForm.startDate || null,
        endDate: phaseForm.endDate || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsPhaseModalOpen(false);
        setSelectedPhase(null);
        fetchProject();
      }
    } catch (err) {}
  };

  const handleCOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${id}/change-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...coForm,
          additionalCost: Math.round(parseFloat(coForm.additionalCost) * 100),
          additionalDays: parseInt(coForm.additionalDays || '0')
        })
      });
      if (res.ok) {
        setIsCOModalOpen(false);
        fetchProject();
      }
    } catch (err) {}
  };

  const handleDelaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${id}/delays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(delayForm)
      });
      if (res.ok) {
        setIsDelayModalOpen(false);
        fetchProject();
      }
    } catch (err) {}
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!project) return <div className="p-10 text-center">Project not found.</div>;

  const coColumns = [
    { key: 'title', label: 'Title' },
    { key: 'additionalCost', label: 'Additional Cost', render: (row: any) => formatCurrency(row.additionalCost) },
    { key: 'additionalDays', label: 'Extra Days', render: (row: any) => `${row.additionalDays} days` },
    { key: 'status', label: 'Status', render: (row: any) => <Badge variant={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'}>{row.status}</Badge> },
    { key: 'createdAt', label: 'Date', render: (row: any) => formatDate(row.createdAt) },
  ];

  const delayColumns = [
    { key: 'reason', label: 'Reason', render: (row: any) => getDelayReasonLabel(row.reason) },
    { key: 'daysLost', label: 'Days Lost', render: (row: any) => <span className="font-bold text-red-600">{row.daysLost} days</span> },
    { key: 'startDate', label: 'Start Date', render: (row: any) => formatDate(row.startDate) },
    { key: 'endDate', label: 'End Date', render: (row: any) => formatDate(row.endDate) },
    { key: 'description', label: 'Description' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-1">{project.client?.name} • {project.location}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={getStatusColor(project.status) as any}>{project.status}</Badge>
          <Button variant="secondary" onClick={() => setIsEditProjectOpen(true)}>Edit</Button>
          <Button variant="danger" onClick={async () => {
            if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
              await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
              router.push('/projects');
            }
          }}>Delete</Button>
        </div>
      </div>

      <Tabs 
        tabs={[
          { key: 'Overview', label: 'Overview' },
          { key: 'Phases', label: 'Phases' },
          { key: 'Change Orders', label: 'Change Orders' },
          { key: 'Delays', label: 'Delays' },
        ]} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Original Budget" value={formatCurrency(project.estimatedBudget)} />
          <StatCard 
            title="Revised Budget" 
            value={formatCurrency(project.revisedBudget || project.estimatedBudget)} 
            trend={project.revisedBudget > project.estimatedBudget ? 'up' : 'neutral'} 
          />
          <StatCard title="Start Date" value={formatDate(project.startDate)} />
          <StatCard 
            title="Revised End Date" 
            value={formatDate(project.revisedEndDate || project.expectedEndDate)} 
            trend={project.revisedEndDate && project.revisedEndDate > project.expectedEndDate ? 'down' : 'neutral'} 
          />
        </div>
      )}

      {activeTab === 'Phases' && (
        <Card title="Project Phases" action={<Button onClick={() => {
          setSelectedPhase(null);
          setPhaseForm({ name: '', status: 'Pending', progress: 0, startDate: '', endDate: '' });
          setIsPhaseModalOpen(true);
        }}>Add Phase</Button>}>
          <div className="space-y-4">
            {project.phases.map((phase: any) => (
              <div key={phase.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{phase.name}</h3>
                    <Badge variant={getStatusColor(phase.status) as any}>{phase.status}</Badge>
                  </div>
                  <div className="mt-2 w-full max-w-md bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${phase.progress}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">{phase.progress}% Complete</span>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Button variant="secondary" size="sm" onClick={() => {
                    setSelectedPhase(phase);
                    setPhaseForm({
                      name: phase.name, status: phase.status, progress: phase.progress, 
                      startDate: phase.startDate?.split('T')[0] || '', endDate: phase.endDate?.split('T')[0] || ''
                    });
                    setIsPhaseModalOpen(true);
                  }}>Update</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'Change Orders' && (
        <Card title="Change Orders" action={<Button onClick={() => setIsCOModalOpen(true)}>Add Order</Button>}>
          <DataTable columns={coColumns} data={project.changeOrders} emptyMessage="No change orders yet." />
        </Card>
      )}

      {activeTab === 'Delays' && (
        <Card title="Delay Logs" action={<Button onClick={() => setIsDelayModalOpen(true)}>Report Delay</Button>}>
          <DataTable columns={delayColumns} data={project.delayLogs} emptyMessage="No delays reported." />
        </Card>
      )}

      {/* Edit Project Modal */}
      <Modal isOpen={isEditProjectOpen} onClose={() => setIsEditProjectOpen(false)} title="Edit Project">
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <Input label="Project Name" value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} />
          <Select label="Status" value={projectForm.status} onChange={(e) => setProjectForm({...projectForm, status: e.target.value})} options={[
            { value: 'planning', label: 'Planning' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'on_hold', label: 'On Hold' },
            { value: 'completed', label: 'Completed' },
          ]} />
          <Input type="date" label="Expected End Date" value={projectForm.expectedEndDate} onChange={(e) => setProjectForm({...projectForm, expectedEndDate: e.target.value})} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsEditProjectOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Phase Modal */}
      <Modal isOpen={isPhaseModalOpen} onClose={() => setIsPhaseModalOpen(false)} title={selectedPhase ? "Edit Phase" : "Add Phase"} size="md">
        <form onSubmit={handlePhaseSubmit} className="space-y-4">
          <Input label="Phase Name" value={phaseForm.name} onChange={(e) => setPhaseForm({...phaseForm, name: e.target.value})} required />
          <Select label="Status" value={phaseForm.status} onChange={(e) => setPhaseForm({...phaseForm, status: e.target.value})} options={[
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]} />
          <Input type="range" label={`Progress: ${phaseForm.progress}%`} value={phaseForm.progress} onChange={(e) => setPhaseForm({...phaseForm, progress: parseInt(e.target.value)})} min="0" max="100" />
          <Input type="date" label="Start Date" value={phaseForm.startDate} onChange={(e) => setPhaseForm({...phaseForm, startDate: e.target.value})} />
          <Input type="date" label="End Date" value={phaseForm.endDate} onChange={(e) => setPhaseForm({...phaseForm, endDate: e.target.value})} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsPhaseModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Change Order Modal */}
      <Modal isOpen={isCOModalOpen} onClose={() => setIsCOModalOpen(false)} title="New Change Order">
        <form onSubmit={handleCOSubmit} className="space-y-4">
          <Input label="Title" value={coForm.title} onChange={(e) => setCoForm({...coForm, title: e.target.value})} required />
          <TextArea label="Reason" value={coForm.reason} onChange={(e) => setCoForm({...coForm, reason: e.target.value})} required />
          <Input type="number" label="Additional Cost (₹)" value={coForm.additionalCost} onChange={(e) => setCoForm({...coForm, additionalCost: e.target.value})} required />
          <Input type="number" label="Additional Days" value={coForm.additionalDays} onChange={(e) => setCoForm({...coForm, additionalDays: e.target.value})} />
          <Select label="Status" value={coForm.status} onChange={(e) => setCoForm({...coForm, status: e.target.value})} options={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsCOModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Delay Log Modal */}
      <Modal isOpen={isDelayModalOpen} onClose={() => setIsDelayModalOpen(false)} title="Report Delay">
        <form onSubmit={handleDelaySubmit} className="space-y-4">
          <Select label="Reason for Delay" value={delayForm.reason} onChange={(e) => setDelayForm({...delayForm, reason: e.target.value})} options={[
            { value: 'weather', label: 'Weather / Rain' },
            { value: 'material_shortage', label: 'Material Shortage' },
            { value: 'labour_shortage', label: 'Labour Shortage' },
            { value: 'payment_pending', label: 'Payment Pending' },
            { value: 'permit_pending', label: 'Permit Pending' },
            { value: 'design_change', label: 'Design Change' },
            { value: 'other', label: 'Other' },
          ]} />
          <Input type="date" label="Start Date" value={delayForm.startDate} onChange={(e) => setDelayForm({...delayForm, startDate: e.target.value})} required />
          <Input type="date" label="End Date" value={delayForm.endDate} onChange={(e) => setDelayForm({...delayForm, endDate: e.target.value})} required />
          <TextArea label="Description" value={delayForm.description} onChange={(e) => setDelayForm({...delayForm, description: e.target.value})} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsDelayModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
