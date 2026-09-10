"use client";

import { useState, useEffect } from 'react';
import { Card, Button, Modal, Badge, Input, SearchBar, PageHeader, ConfirmDialog } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  address: string | null;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  _count?: {
    projects: number;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gstNumber: '',
    address: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      setSelectedClientDetail(data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch client detail', error);
    }
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        phone: client.phone || '',
        email: client.email || '',
        gstNumber: client.gstNumber || '',
        address: client.address || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        gstNumber: '',
        address: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      setIsModalOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Failed to save client', error);
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await fetch(`/api/clients/${clientToDelete}`, { method: 'DELETE' });
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      if (isDetailModalOpen) setIsDetailModalOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client', error);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Clients" 
        action={<Button onClick={() => handleOpenModal()}>Add Client</Button>}
      />

      <div className="mb-4 max-w-md">
        <SearchBar 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder="Search clients..." 
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <Card key={client.id} title={client.name}>
              <div 
                className="space-y-4 cursor-pointer" 
                onClick={() => fetchClientDetail(client.id)}
              >
                <div className="text-sm text-gray-600">
                  <p>{client.phone || 'No phone'}</p>
                  <p>{client.email || 'No email'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Projects</p>
                    <p className="font-semibold">{client._count?.projects || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Total Billed</p>
                    <p className="font-semibold">{formatCurrency(client.totalBilled || 0)}</p>
                  </div>
                  <div className="col-span-2 mt-2">
                    <p className="text-gray-500 text-xs">Outstanding</p>
                    <p className={`font-semibold ${(client.outstanding || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(client.outstanding || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No clients found.
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? "Edit Client" : "Add Client"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <Input 
            label="Phone" 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
          />
          <Input 
            label="Email" 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
          />
          <Input 
            label="GST Number" 
            value={formData.gstNumber} 
            onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} 
          />
          <Input 
            label="Address" 
            value={formData.address} 
            onChange={(e) => setFormData({...formData, address: e.target.value})} 
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Client Details"
        size="lg"
      >
        {selectedClientDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{selectedClientDetail.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{selectedClientDetail.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{selectedClientDetail.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">GST Number</p>
                <p className="font-medium">{selectedClientDetail.gstNumber || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Address</p>
                <p className="font-medium">{selectedClientDetail.address || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Projects</h3>
              {selectedClientDetail.projects?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedClientDetail.projects.map((p: any) => (
                    <Badge key={p.id} variant="neutral">{p.name}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No projects found.</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Invoices</h3>
              {selectedClientDetail.invoices?.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Inv #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedClientDetail.invoices.map((inv: any) => (
                        <tr key={inv.id}>
                          <td className="px-4 py-2 text-sm">{inv.invoiceNumber}</td>
                          <td className="px-4 py-2 text-sm">{formatDate(inv.issueDate)}</td>
                          <td className="px-4 py-2 text-sm">{formatCurrency(inv.totalAmount)}</td>
                          <td className="px-4 py-2 text-sm">
                            <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'info'}>
                              {inv.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No invoices found.</p>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="danger" onClick={() => {
                setClientToDelete(selectedClientDetail.id);
                setIsDeleteModalOpen(true);
              }}>
                Delete Client
              </Button>
              <Button onClick={() => {
                setIsDetailModalOpen(false);
                handleOpenModal(selectedClientDetail);
              }}>
                Edit Client
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
