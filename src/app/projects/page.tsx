"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Modal, Badge, Input, Select, StatCard, SearchBar, Tabs } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', location: '', projectType: 'residential', clientId: '', 
    status: 'planning', estimatedBudget: '', startDate: '', expectedEndDate: ''
  });

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) setProjects(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) setClients(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        estimatedBudget: Math.round(parseFloat(formData.estimatedBudget) * 100),
      };
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesTab = activeTab === 'All' || p.status.toLowerCase() === activeTab.toLowerCase().replace(' ', '_');
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Button onClick={() => setIsModalOpen(true)}>New Project</Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs 
          tabs={[
            { key: 'All', label: 'All Projects' },
            { key: 'Planning', label: 'Planning' },
            { key: 'In Progress', label: 'In Progress' },
            { key: 'Completed', label: 'Completed' },
          ]} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        <div className="w-full sm:w-72">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search projects..." />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const hasRevisedBudget = project.revisedBudget && project.revisedBudget !== project.estimatedBudget;
            return (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div onClick={() => router.push(`/projects/${project.id}`)}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.client?.name} • {project.location}</p>
                    </div>
                    <Badge variant={project.status === 'completed' ? 'success' : project.status === 'in_progress' ? 'info' : 'neutral'}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Budget</span>
                      <div className="text-right">
                        {hasRevisedBudget ? (
                          <>
                            <span className="line-through text-xs text-gray-400 mr-2">{formatCurrency(project.estimatedBudget)}</span>
                            <span className="font-medium text-orange-600">{formatCurrency(project.revisedBudget)}</span>
                          </>
                        ) : (
                          <span className="font-medium">{formatCurrency(project.estimatedBudget)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Timeline</span>
                      <span className="font-medium">
                        {formatDate(project.startDate)} - {formatDate(project.revisedEndDate || project.expectedEndDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t text-xs text-gray-500">
                    <span>{project._count?.phases || 0} Phases</span>
                    <span>{project._count?.changeOrders || 0} Change Orders</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project" size="md">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input label="Project Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <Input label="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Project Type" value={formData.projectType} onChange={(e) => setFormData({...formData, projectType: e.target.value})} options={[
              { value: 'residential', label: 'Residential' },
              { value: 'commercial', label: 'Commercial' },
              { value: 'industrial', label: 'Industrial' },
            ]} />
            <Select label="Client" value={formData.clientId} onChange={(e) => setFormData({...formData, clientId: e.target.value})} options={[
              { value: '', label: 'Select Client' },
              ...clients.map(c => ({ value: c.id, label: c.name }))
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Estimated Budget (₹)" type="number" value={formData.estimatedBudget} onChange={(e) => setFormData({...formData, estimatedBudget: e.target.value})} />
            <Select label="Status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} options={[
              { value: 'planning', label: 'Planning' },
              { value: 'in_progress', label: 'In Progress' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            <Input label="Expected End Date" type="date" value={formData.expectedEndDate} onChange={(e) => setFormData({...formData, expectedEndDate: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit">Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
