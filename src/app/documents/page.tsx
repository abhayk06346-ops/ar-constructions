"use client";

import { useState, useEffect } from 'react';
import { Card, Button, Modal, Badge, Input, Select, PageHeader, ConfirmDialog, SearchBar, TextArea } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
}

interface Document {
  id: string;
  name: string;
  category: string;
  projectId: string | null;
  project?: { name: string };
  filePath: string;
  notes: string | null;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterProject, setFilterProject] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'contract',
    projectId: '',
    filePath: '',
    notes: '',
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, [filterCategory, filterProject]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const url = new URL(window.location.origin + '/api/documents');
      if (filterCategory !== 'All') url.searchParams.append('category', filterCategory);
      if (filterProject !== 'All') url.searchParams.append('projectId', filterProject);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
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

  const handleOpenModal = () => {
    setFormData({
      name: '',
      category: 'contract',
      projectId: filterProject !== 'All' ? filterProject : '',
      filePath: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, filePath: reader.result as string, name: formData.name || file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.filePath) {
      alert('Please select a file');
      return;
    }
    
    setIsUploading(true);
    try {
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      setIsModalOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to upload document', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await fetch(`/api/documents/${docToDelete}`, { method: 'DELETE' });
      setIsDeleteModalOpen(false);
      setDocToDelete(null);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document', error);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { value: 'contract', label: 'Contract' },
    { value: 'permit', label: 'Permit' },
    { value: 'drawing', label: 'Drawing' },
    { value: 'bill', label: 'Bill' },
    { value: 'quotation', label: 'Quotation' },
    { value: 'approval', label: 'Approval' },
    { value: 'other', label: 'Other' },
  ];

  const handleViewDocument = (base64String: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<iframe src="${base64String}" width="100%" height="100%" style="border:none;"></iframe>`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Documents" 
        action={<Button onClick={handleOpenModal}>Upload Document</Button>}
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SearchBar 
            value={searchTerm} 
            onChange={setSearchTerm} 
            placeholder="Search documents..." 
          />
          <Select 
            label=""
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)} 
            options={[
              { value: 'All', label: 'All Categories' },
              ...categories
            ]}
          />
          <Select 
            label=""
            value={filterProject} 
            onChange={(e) => setFilterProject(e.target.value)} 
            options={[
              { value: 'All', label: 'All Projects' },
              ...projects.map(p => ({ value: p.id, label: p.name }))
            ]}
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg truncate pr-2" title={doc.name}>{doc.name}</h3>
                  <Badge variant="info">{doc.category}</Badge>
                </div>
                <div className="text-sm text-gray-500 space-y-1 mb-4">
                  <p>Project: {doc.project?.name || 'General'}</p>
                  <p>Date: {formatDate(doc.createdAt)}</p>
                  {doc.notes && <p className="truncate" title={doc.notes}>{doc.notes}</p>}
                </div>
                <div className="flex justify-between mt-auto">
                  <Button size="sm" variant="secondary" onClick={() => handleViewDocument(doc.filePath)}>View</Button>
                  <Button size="sm" variant="danger" onClick={() => { setDocToDelete(doc.id); setIsDeleteModalOpen(true); }}>Delete</Button>
                </div>
              </div>
            ))}
            {filteredDocs.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No documents found.
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Document"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Document Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            
          />
          <Select 
            label="Category" 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})} 
            options={categories}
           
          />
          <Select 
            label="Project (Optional)" 
            value={formData.projectId} 
            onChange={(e) => setFormData({...formData, projectId: e.target.value})} 
            options={[
              { value: '', label: 'None / General' },
              ...projects.map(p => ({ value: p.id, label: p.name }))
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
             
            />
          </div>
          <TextArea 
            label="Notes" 
            value={formData.notes} 
            onChange={(e) => setFormData({...formData, notes: e.target.value})} 
            rows={2}
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isUploading}>Cancel</Button>
            <Button type="submit" disabled={isUploading}>{isUploading ? 'Uploading...' : 'Upload'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
