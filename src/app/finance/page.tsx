"use client";

import { useState, useEffect } from 'react';
import { Card, Button, Modal, DataTable, Badge, Input, Select, TextArea, StatCard, Tabs, PageHeader, EmptyState, ConfirmDialog } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txFormType, setTxFormType] = useState<'income' | 'expense'>('income');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Filters state for transactions
  const [txFilterType, setTxFilterType] = useState('all');
  const [txFilterProject, setTxFilterProject] = useState('');

  // Form states
  const initialTxForm = {
    category: '',
    amount: '',
    gstAmount: '0',
    description: '',
    projectId: '',
    paymentMode: 'bank_transfer',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    vendorId: '',
    clientId: ''
  };
  const [txForm, setTxForm] = useState(initialTxForm);

  const initialInvoiceForm = {
    clientId: '',
    projectId: '',
    gstRate: '18',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: '',
    items: [{ description: '', quantity: 1, unit: 'nos', rate: '', hsnCode: '' }]
  };
  const [invoiceForm, setInvoiceForm] = useState<any>(initialInvoiceForm);

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
    fetchInvoices();
    fetchDropdownData();
  }, []);

  const fetchSummary = async () => {
    const res = await fetch('/api/finance/summary');
    if (res.ok) setSummary(await res.json());
  };

  const fetchTransactions = async () => {
    let url = '/api/finance/transactions?';
    if (txFilterType !== 'all') url += `type=${txFilterType}&`;
    if (txFilterProject) url += `projectId=${txFilterProject}`;
    const res = await fetch(url);
    if (res.ok) setTransactions(await res.json());
  };

  const fetchInvoices = async () => {
    const res = await fetch('/api/finance/invoices');
    if (res.ok) setInvoices(await res.json());
  };

  const fetchDropdownData = async () => {
    try {
      const [pRes, cRes, vRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/clients'),
        fetch('/api/vendors')
      ]);
      if (pRes.ok) setProjects(await pRes.json());
      if (cRes.ok) setClients(await cRes.json());
      if (vRes.ok) setVendors(await vRes.json());
    } catch (error) {
      console.error("Dropdown fetch error", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [txFilterType, txFilterProject]);

  // Handle Transactions
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...txForm,
      type: txFormType,
      amount: Math.round(Number(txForm.amount) * 100),
      gstAmount: Math.round(Number(txForm.gstAmount) * 100)
    };

    const res = await fetch('/api/finance/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsTxModalOpen(false);
      fetchTransactions();
      fetchSummary();
    }
  };

  // Handle Invoices
  const handleInvoiceItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...invoiceForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const handleAddInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, unit: 'nos', rate: '', hsnCode: '' }]
    });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    const newItems = invoiceForm.items.filter((_: any, i: number) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Rates are entered in ₹, convert to paise
    const items = invoiceForm.items.map((item: any) => ({
      ...item,
      rate: Math.round(Number(item.rate) * 100)
    }));

    const payload = { ...invoiceForm, items };

    const res = await fetch('/api/finance/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsInvoiceModalOpen(false);
      setInvoiceForm(initialInvoiceForm);
      fetchInvoices();
      fetchSummary();
    }
  };

  const markInvoicePaid = async (id: string) => {
    const res = await fetch(`/api/finance/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paidDate: new Date().toISOString().split('T')[0] })
    });
    if (res.ok) {
      fetchInvoices();
      setSelectedInvoice(null);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'gst', label: 'GST' }
  ];

  const projectOptions = [{ value: '', label: 'Select Project' }, ...projects.map(p => ({ value: p.id, label: p.name }))];
  const clientOptions = [{ value: '', label: 'Select Client' }, ...clients.map(c => ({ value: c.id, label: c.name }))];
  const vendorOptions = [{ value: '', label: 'Select Vendor' }, ...vendors.map(v => ({ value: v.id, label: v.name }))];
  
  const txCategoryOptions = txFormType === 'income' 
    ? [
        { value: 'client_payment', label: 'Client Payment' },
        { value: 'refund', label: 'Refund' },
        { value: 'other', label: 'Other' }
      ]
    : [
        { value: 'materials', label: 'Materials' },
        { value: 'labour', label: 'Labour' },
        { value: 'equipment', label: 'Equipment Rental' },
        { value: 'office', label: 'Office/Admin' },
        { value: 'other', label: 'Other' }
      ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
      paid: 'success',
      draft: 'neutral',
      sent: 'info',
      overdue: 'danger',
      cancelled: 'neutral'
    };
    return <Badge variant={map[status] || 'neutral'}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Finance & Accounting</h1>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
              title="Total Income" 
              value={formatCurrency(summary.totalIncome)} 
              trend="up" 
            />
            <StatCard 
              title="Total Expenses" 
              value={formatCurrency(summary.totalExpenses)} 
              trend="down" 
            />
            <StatCard 
              title="Net Profit" 
              value={formatCurrency(summary.netProfit)} 
              trend={summary.netProfit >= 0 ? 'up' : 'down'} 
            />
            <StatCard 
              title="Net GST Liability" 
              value={formatCurrency(summary.gstLiability)} 
              trend="neutral" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Expenses by Category">
              <div className="space-y-4">
                {summary.expensesByCategory.length === 0 ? (
                  <p className="text-sm text-gray-500">No expenses recorded.</p>
                ) : (
                  summary.expensesByCategory.map((exp: any, i: number) => {
                    const max = Math.max(...summary.expensesByCategory.map((e: any) => e.total));
                    const percentage = (exp.total / max) * 100;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{exp.category.replace('_', ' ')}</span>
                          <span className="font-medium">{formatCurrency(exp.total)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            <Card title="Recent Transactions">
              <div className="space-y-3">
                {transactions.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium text-sm text-slate-800">{t.description}</p>
                      <p className="text-xs text-slate-500">{formatDate(t.date)} • {t.category.replace('_', ' ')}</p>
                    </div>
                    <div className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && <p className="text-sm text-gray-500">No transactions.</p>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <Card title="Transactions">
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="flex gap-4">
              <Select 
                label=""
                value={txFilterType}
                onChange={(e) => setTxFilterType(e.target.value)}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'income', label: 'Income Only' },
                  { value: 'expense', label: 'Expense Only' }
                ]}
              />
              <Select 
                label=""
                value={txFilterProject}
                onChange={(e) => setTxFilterProject(e.target.value)}
                options={[{ value: '', label: 'All Projects' }, ...projectOptions]}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => { setTxFormType('expense'); setTxForm(initialTxForm); setIsTxModalOpen(true); }}>
                Add Expense
              </Button>
              <Button variant="success" onClick={() => { setTxFormType('income'); setTxForm(initialTxForm); setIsTxModalOpen(true); }}>
                Add Income
              </Button>
            </div>
          </div>

          <DataTable 
            columns={[
              { key: 'date', label: 'Date', render: (item: any) => formatDate(item.date) },
              { key: 'description', label: 'Description' },
              { key: 'category', label: 'Category', render: (item: any) => <span className="capitalize">{item.category.replace('_', ' ')}</span> },
              { key: 'project', label: 'Project', render: (item: any) => item.project?.name || '-' },
              { key: 'amount', label: 'Amount', render: (item: any) => (
                <span className={`font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </span>
              )},
              { key: 'paymentMode', label: 'Mode', render: (item: any) => <span className="capitalize">{item.paymentMode.replace('_', ' ')}</span> },
              { key: 'actions', label: 'Actions', render: (item: any) => (
                <Button size="sm" variant="danger" onClick={async () => {
                  if (window.confirm('Delete this transaction?')) {
                    await fetch(`/api/finance/transactions/${item.id}`, { method: 'DELETE' });
                    fetchTransactions();
                  }
                }}>Delete</Button>
              )},
            ]}
            data={transactions}
            emptyMessage="No transactions found matching the filters."
          />
        </Card>
      )}

      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <Card 
          title="Invoices" 
          action={<Button onClick={() => { setInvoiceForm(initialInvoiceForm); setIsInvoiceModalOpen(true); }}>Create Invoice</Button>}
        >
          <DataTable 
            columns={[
              { key: 'invoiceNumber', label: 'Invoice #' },
              { key: 'client', label: 'Client', render: (item: any) => item.client?.name },
              { key: 'project', label: 'Project', render: (item: any) => item.project?.name || '-' },
              { key: 'totalAmount', label: 'Amount', render: (item: any) => formatCurrency(item.totalAmount) },
              { key: 'status', label: 'Status', render: (item: any) => getStatusBadge(item.status) },
              { key: 'issueDate', label: 'Issue Date', render: (item: any) => formatDate(item.issueDate) },
              { key: 'dueDate', label: 'Due Date', render: (item: any) => formatDate(item.dueDate) },
            ]}
            data={invoices}
            onRowClick={(item) => setSelectedInvoice(item)}
            emptyMessage="No invoices generated yet."
          />
        </Card>
      )}

      {/* GST TAB */}
      {activeTab === 'gst' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="GST Collected (Output)" 
              value={formatCurrency(summary.gstCollected)} 
              trend="up" 
            />
            <StatCard 
              title="GST Paid (Input)" 
              value={formatCurrency(summary.gstPaid)} 
              trend="down" 
            />
            <StatCard 
              title="Net GST Liability" 
              value={formatCurrency(summary.gstLiability)} 
              trend="neutral" 
            />
          </div>
          
          <Card title="GST Transactions (Last 50)">
            <DataTable 
              columns={[
                { key: 'date', label: 'Date', render: (item: any) => formatDate(item.date) },
                { key: 'description', label: 'Description' },
                { key: 'type', label: 'Type', render: (item: any) => (
                  <Badge variant={item.type === 'income' ? 'success' : 'danger'}>
                    {item.type === 'income' ? 'OUTPUT' : 'INPUT'}
                  </Badge>
                )},
                { key: 'amount', label: 'Base Amount', render: (item: any) => formatCurrency(item.amount) },
                { key: 'gstAmount', label: 'GST Amount', render: (item: any) => <span className="font-bold">{formatCurrency(item.gstAmount)}</span> },
              ]}
              data={transactions.filter(t => t.gstAmount > 0).slice(0, 50)}
              emptyMessage="No GST transactions found."
            />
          </Card>
        </div>
      )}

      {/* Transaction Modal */}
      <Modal 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)} 
        title={`Add ${txFormType === 'income' ? 'Income' : 'Expense'}`}
      >
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Category" 
              value={txForm.category} 
              onChange={(e: any) => setTxForm({ ...txForm, category: e.target.value })}
              options={[{ value: '', label: 'Select Category' }, ...txCategoryOptions]}
             
            />
            <Input 
              label="Date" 
              type="date" 
              value={txForm.date} 
              onChange={(e: any) => setTxForm({ ...txForm, date: e.target.value })}
             
            />
            <Input 
              label="Amount (₹)" 
              type="number" 
              step="0.01"
              value={txForm.amount} 
              onChange={(e: any) => setTxForm({ ...txForm, amount: e.target.value })}
             
            />
            <Input 
              label="GST Amount (₹) if any" 
              type="number" 
              step="0.01"
              value={txForm.gstAmount} 
              onChange={(e: any) => setTxForm({ ...txForm, gstAmount: e.target.value })}
            />
            <Select 
              label="Project (Optional)" 
              value={txForm.projectId} 
              onChange={(e: any) => setTxForm({ ...txForm, projectId: e.target.value })}
              options={[{ value: '', label: 'None' }, ...projectOptions]}
            />
            {txFormType === 'income' ? (
              <Select 
                label="Client (Optional)" 
                value={txForm.clientId} 
                onChange={(e: any) => setTxForm({ ...txForm, clientId: e.target.value })}
                options={[{ value: '', label: 'None' }, ...clientOptions]}
              />
            ) : (
              <Select 
                label="Vendor (Optional)" 
                value={txForm.vendorId} 
                onChange={(e: any) => setTxForm({ ...txForm, vendorId: e.target.value })}
                options={[{ value: '', label: 'None' }, ...vendorOptions]}
              />
            )}
            <Select 
              label="Payment Mode" 
              value={txForm.paymentMode} 
              onChange={(e: any) => setTxForm({ ...txForm, paymentMode: e.target.value })}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'upi', label: 'UPI' },
                { value: 'cheque', label: 'Cheque' }
              ]}
             
            />
            <Input 
              label="Reference (Txn ID/Cheque No)" 
              value={txForm.reference} 
              onChange={(e: any) => setTxForm({ ...txForm, reference: e.target.value })}
            />
          </div>
          <TextArea 
            label="Description" 
            value={txForm.description} 
            onChange={(e: any) => setTxForm({ ...txForm, description: e.target.value })}
           
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsTxModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => setIsInvoiceModalOpen(false)} 
        title="Create Invoice"
        size="lg"
      >
        <form onSubmit={handleInvoiceSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Client" 
              value={invoiceForm.clientId} 
              onChange={(e: any) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
              options={[{ value: '', label: 'Select Client' }, ...clientOptions]}
             
            />
            <Select 
              label="Project (Optional)" 
              value={invoiceForm.projectId} 
              onChange={(e: any) => setInvoiceForm({ ...invoiceForm, projectId: e.target.value })}
              options={[{ value: '', label: 'None' }, ...projectOptions]}
            />
            <Input 
              label="Issue Date" 
              type="date" 
              value={invoiceForm.issueDate} 
              onChange={(e: any) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
             
            />
            <Input 
              label="Due Date" 
              type="date" 
              value={invoiceForm.dueDate} 
              onChange={(e: any) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
             
            />
            <Select 
              label="GST Rate (%)" 
              value={invoiceForm.gstRate} 
              onChange={(e: any) => setInvoiceForm({ ...invoiceForm, gstRate: e.target.value })}
              options={[
                { value: '0', label: '0%' },
                { value: '5', label: '5%' },
                { value: '12', label: '12%' },
                { value: '18', label: '18%' },
                { value: '28', label: '28%' }
              ]}
             
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold text-slate-800">Line Items</h3>
            {invoiceForm.items.map((item: any, i: number) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input 
                    label={i === 0 ? "Description" : ""} 
                    value={item.description} 
                    onChange={(e: any) => handleInvoiceItemChange(i, 'description', e.target.value)}
                   
                  />
                </div>
                <div className="w-20">
                  <Input 
                    label={i === 0 ? "Qty" : ""} 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e: any) => handleInvoiceItemChange(i, 'quantity', e.target.value)}
                   
                  />
                </div>
                <div className="w-24">
                  <Input 
                    label={i === 0 ? "Unit" : ""} 
                    value={item.unit} 
                    onChange={(e: any) => handleInvoiceItemChange(i, 'unit', e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <Input 
                    label={i === 0 ? "Rate (₹)" : ""} 
                    type="number" 
                    step="0.01"
                    value={item.rate} 
                    onChange={(e: any) => handleInvoiceItemChange(i, 'rate', e.target.value)}
                   
                  />
                </div>
                <div className="w-24">
                  <Input 
                    label={i === 0 ? "HSN" : ""} 
                    value={item.hsnCode} 
                    onChange={(e: any) => handleInvoiceItemChange(i, 'hsnCode', e.target.value)}
                  />
                </div>
                {invoiceForm.items.length > 1 && (
                  <Button variant="danger" onClick={() => handleRemoveInvoiceItem(i)} className="mb-1 px-3 py-2">X</Button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={handleAddInvoiceItem} className="mt-2 text-sm">
              + Add Item
            </Button>
          </div>

          <TextArea 
            label="Notes" 
            value={invoiceForm.notes} 
            onChange={(e: any) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedInvoice(null)} 
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex justify-between border-b pb-4">
              <div>
                <p className="text-sm text-slate-500">Bill To:</p>
                <p className="font-semibold text-lg">{selectedInvoice.client?.name}</p>
                <p className="text-sm text-slate-600">{selectedInvoice.project?.name && `Project: ${selectedInvoice.project?.name}`}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                <p className="text-sm mt-2"><span className="text-slate-500">Issued:</span> {formatDate(selectedInvoice.issueDate)}</p>
                <p className="text-sm"><span className="text-slate-500">Due:</span> {formatDate(selectedInvoice.dueDate)}</p>
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-2">Description</th>
                  <th className="p-2">HSN</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Rate</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.description}</td>
                    <td className="p-2">{item.hsnCode || '-'}</td>
                    <td className="p-2">{item.quantity} {item.unit}</td>
                    <td className="p-2">{formatCurrency(item.rate)}</td>
                    <td className="p-2 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end space-y-1">
              <div className="w-64 text-sm">
                <div className="flex justify-between p-1">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between p-1">
                  <span className="text-slate-500">GST ({selectedInvoice.gstRate}%)</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.gstAmount)}</span>
                </div>
                <div className="flex justify-between p-1 border-t mt-1 font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                <strong>Notes:</strong> {selectedInvoice.notes}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t no-print">
              <Button variant="secondary" onClick={() => window.print()}>🖨️ Print</Button>
              <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>Close</Button>
              {selectedInvoice.status !== 'paid' && (
                <Button variant="success" onClick={() => markInvoicePaid(selectedInvoice.id)}>Mark as Paid</Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
