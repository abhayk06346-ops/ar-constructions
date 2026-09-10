"use client";

import { useState, useEffect } from 'react';
import { Card, Button, Modal, DataTable, Badge, Input, SearchBar, PageHeader, ConfirmDialog } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  address: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  materials: string | null;
  _count?: {
    purchaseOrders: number;
    stockTransactions: number;
  };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gstNumber: '',
    address: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    materials: '',
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      setVendors(data);
    } catch (error) {
      console.error('Failed to fetch vendors', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/vendors/${id}`);
      const data = await res.json();
      setSelectedVendorDetail(data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch vendor detail', error);
    }
  };

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        phone: vendor.phone || '',
        email: vendor.email || '',
        gstNumber: vendor.gstNumber || '',
        address: vendor.address || '',
        bankName: vendor.bankName || '',
        accountNumber: vendor.accountNumber || '',
        ifscCode: vendor.ifscCode || '',
        materials: vendor.materials || '',
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        gstNumber: '',
        address: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        materials: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors';
      const method = editingVendor ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      setIsModalOpen(false);
      fetchVendors();
    } catch (error) {
      console.error('Failed to save vendor', error);
    }
  };

  const handleDelete = async () => {
    if (!vendorToDelete) return;
    try {
      await fetch(`/api/vendors/${vendorToDelete}`, { method: 'DELETE' });
      setIsDeleteModalOpen(false);
      setVendorToDelete(null);
      if (isDetailModalOpen) setIsDetailModalOpen(false);
      fetchVendors();
    } catch (error) {
      console.error('Failed to delete vendor', error);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.materials && v.materials.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'gstNumber', label: 'GST Number' },
    { key: 'materials', label: 'Materials' },
    { 
      key: 'orders', 
      label: 'Orders Count',
      render: (v: Vendor) => v._count?.purchaseOrders || 0
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendors" 
        action={<Button onClick={() => handleOpenModal()}>Add Vendor</Button>}
      />

      <Card>
        <div className="mb-4">
          <SearchBar 
            value={searchTerm} 
            onChange={setSearchTerm} 
            placeholder="Search vendors by name or materials..." 
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredVendors} 
            onRowClick={(v) => fetchVendorDetail(v.id)}
            emptyMessage="No vendors found"
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVendor ? "Edit Vendor" : "Add Vendor"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="md:col-span-2">
              <Input 
                label="Address" 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
              />
            </div>
            <div className="md:col-span-2">
              <Input 
                label="Materials (comma separated)" 
                value={formData.materials} 
                onChange={(e) => setFormData({...formData, materials: e.target.value})} 
                placeholder="e.g. Cement, Steel, Bricks"
              />
            </div>
            <Input 
              label="Bank Name" 
              value={formData.bankName} 
              onChange={(e) => setFormData({...formData, bankName: e.target.value})} 
            />
            <Input 
              label="Account Number" 
              value={formData.accountNumber} 
              onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} 
            />
            <Input 
              label="IFSC Code" 
              value={formData.ifscCode} 
              onChange={(e) => setFormData({...formData, ifscCode: e.target.value})} 
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Vendor Details"
        size="lg"
      >
        {selectedVendorDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{selectedVendorDetail.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{selectedVendorDetail.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{selectedVendorDetail.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">GST Number</p>
                <p className="font-medium">{selectedVendorDetail.gstNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Materials</p>
                <p className="font-medium">{selectedVendorDetail.materials || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Bank Account</p>
                <p className="font-medium">
                  {selectedVendorDetail.bankName ? `${selectedVendorDetail.bankName} - ${selectedVendorDetail.accountNumber}` : 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Purchase Orders</h3>
              {selectedVendorDetail.purchaseOrders?.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedVendorDetail.purchaseOrders.map((po: any) => (
                        <tr key={po.id}>
                          <td className="px-4 py-2 text-sm">{po.poNumber}</td>
                          <td className="px-4 py-2 text-sm">{formatDate(po.orderDate)}</td>
                          <td className="px-4 py-2 text-sm">{formatCurrency(po.totalAmount)}</td>
                          <td className="px-4 py-2 text-sm"><Badge variant="info">{po.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No purchase orders found.</p>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="danger" onClick={() => {
                setVendorToDelete(selectedVendorDetail.id);
                setIsDeleteModalOpen(true);
              }}>
                Delete Vendor
              </Button>
              <Button onClick={() => {
                setIsDetailModalOpen(false);
                handleOpenModal(selectedVendorDetail);
              }}>
                Edit Vendor
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
