"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Modal, DataTable, Badge, Input, Select, Tabs, StatCard } from '@/components/ui';
import { formatCurrency, formatDate, formatStatus, getStatusColor, getSkillLabel, toPaise, toRupees, getTodayISO } from '@/lib/utils';

export default function LabourPage() {
  const [activeTab, setActiveTab] = useState('workers');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Labour & Workforce</h1>
      </div>

      <Tabs 
        tabs={[
          { key: 'workers', label: 'Workers' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'wages', label: 'Wages' },
          { key: 'contractors', label: 'Contractors' }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'workers' && <WorkersTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'wages' && <WagesTab />}
      {activeTab === 'contractors' && <ContractorsTab />}
    </div>
  );
}

const skillTypes = [
  { value: 'mason', label: 'Mason (Mistri)' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'painter', label: 'Painter' },
  { value: 'helper', label: 'Helper' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'other', label: 'Other' },
];

function WorkersTab() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [skillType, setSkillType] = useState('helper');
  const [dailyWage, setDailyWage] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [status, setStatus] = useState('active');

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  const fetchWorkers = async () => {
    setLoading(true);
    let url = '/api/labour/workers';
    if (filterSkill) url += `?skillType=${filterSkill}`;
    const res = await fetch(url);
    if (res.ok) {
      setWorkers(await res.json());
    }
    setLoading(false);
  };

  const fetchContractors = async () => {
    const res = await fetch('/api/labour/contractors');
    if (res.ok) setContractors(await res.json());
  };

  useEffect(() => {
    fetchWorkers();
    fetchContractors();
  }, [filterSkill]);

  const handleOpenModal = (worker: any = null) => {
    setEditingWorker(worker);
    if (worker) {
      setName(worker.name);
      setPhone(worker.phone || '');
      setAadhaarLast4(worker.aadhaarLast4 || '');
      setSkillType(worker.skillType);
      setDailyWage(toRupees(worker.dailyWage).toString());
      setContractorId(worker.contractorId || '');
      setStatus(worker.status);
    } else {
      setName('');
      setPhone('');
      setAadhaarLast4('');
      setSkillType('helper');
      setDailyWage('');
      setContractorId('');
      setStatus('active');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const data = {
      name,
      phone,
      aadhaarLast4,
      skillType,
      dailyWage: toPaise(parseFloat(dailyWage) || 0),
      contractorId: contractorId || null,
      status
    };

    const method = editingWorker ? 'PUT' : 'POST';
    const url = editingWorker ? `/api/labour/workers/${editingWorker.id}` : '/api/labour/workers';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchWorkers();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this worker?')) {
      const res = await fetch(`/api/labour/workers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchWorkers();
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.phone && w.phone.includes(searchTerm))
  );

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'skill', label: 'Skill', render: (row: any) => getSkillLabel(row.skillType) },
    { key: 'wage', label: 'Daily Wage', render: (row: any) => formatCurrency(row.dailyWage) },
    { key: 'phone', label: 'Phone', render: (row: any) => row.phone || '-' },
    { key: 'aadhaar', label: 'Aadhaar', render: (row: any) => row.aadhaarLast4 ? `xxxx-${row.aadhaarLast4}` : '-' },
    { key: 'contractor', label: 'Contractor', render: (row: any) => row.contractor?.name || 'Direct' },
    { key: 'status', label: 'Status', render: (row: any) => (
      <Badge variant={getStatusColor(row.status) as any}>{formatStatus(row.status)}</Badge>
    )},
    { key: 'actions', label: 'Actions', render: (row: any) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
      </div>
    )}
  ];

  const contractorOptions = [{ value: '', label: 'None (Direct Worker)' }].concat(
    contractors.map(c => ({ value: c.id, label: c.name }))
  );

  return (
    <Card 
      title="Workers" 
      action={<Button onClick={() => handleOpenModal()}>Add Worker</Button>}
    >
      <div className="flex gap-4 mb-4">
        <Input 
          placeholder="Search by name or phone..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <Select 
          value={filterSkill}
          onChange={(e) => setFilterSkill(e.target.value)}
          options={[{ value: '', label: 'All Skills' }].concat(skillTypes)}
        />
      </div>

      <DataTable 
        columns={columns}
        data={filteredWorkers}
        emptyMessage={loading ? "Loading..." : "No workers found."}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingWorker ? "Edit Worker" : "Add Worker"}
      >
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="Aadhaar (Last 4)" value={aadhaarLast4} onChange={e => setAadhaarLast4(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Skill Type" value={skillType} onChange={e => setSkillType(e.target.value)} options={skillTypes} />
            <Input label="Daily Wage (₹)" type="number" value={dailyWage} onChange={e => setDailyWage(e.target.value)} />
          </div>
          <Select label="Contractor" value={contractorId} onChange={e => setContractorId(e.target.value)} options={contractorOptions} />
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value)} options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]} />
          
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function AttendanceTab() {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(getTodayISO());
  
  const [workers, setWorkers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { status: string, overtimeHours: number }>>({});
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      const res = await fetch('/api/projects');
      if (res.ok) setProjects(await res.json());
    };
    fetchProjects();
    
    const fetchWorkers = async () => {
      const res = await fetch('/api/labour/workers?status=active');
      if (res.ok) setWorkers(await res.json());
    };
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (!projectId || !date) return;
    
    const fetchAttendance = async () => {
      const res = await fetch(`/api/labour/attendance?projectId=${projectId}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        const attMap: Record<string, { status: string, overtimeHours: number }> = {};
        data.forEach((att: any) => {
          attMap[att.workerId] = { status: att.status, overtimeHours: att.overtimeHours };
        });
        setAttendance(attMap);
      }
    };
    fetchAttendance();
  }, [projectId, date]);

  const markAttendance = (workerId: string, status: string, overtimeHours: number = 0) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: { status, overtimeHours }
    }));
  };

  const handleSaveAll = async () => {
    if (!projectId || !date) return;
    setSaving(true);
    
    const records = Object.keys(attendance).map(workerId => ({
      workerId,
      status: attendance[workerId].status,
      overtimeHours: attendance[workerId].overtimeHours
    }));
    
    const res = await fetch('/api/labour/attendance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, date, records })
    });
    
    if (res.ok) {
      alert('Attendance saved successfully');
    } else {
      alert('Failed to save attendance');
    }
    setSaving(false);
  };

  const summary = useMemo(() => {
    let p = 0, h = 0, a = 0, ot = 0;
    Object.values(attendance).forEach(att => {
      if (att.status === 'present') p++;
      if (att.status === 'half_day') h++;
      if (att.status === 'absent') a++;
      if (att.status === 'overtime') { p++; ot++; } // assuming overtime also means present
    });
    return { p, h, a, ot };
  }, [attendance]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Select 
              label="Select Project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              options={[{ value: '', label: 'Select a project...' }].concat(
                projects.map(p => ({ value: p.id, label: p.name }))
              )}
            />
          </div>
          <div className="w-48">
            <Input 
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveAll} disabled={!projectId || saving}>
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </Card>

      {!projectId ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            Please select a project to mark attendance.
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4">Name</th>
                  <th className="py-2 px-4">Skill</th>
                  <th className="py-2 px-4">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {workers.map(worker => {
                  const status = attendance[worker.id]?.status;
                  const isP = status === 'present';
                  const isH = status === 'half_day';
                  const isA = status === 'absent';
                  const isOT = status === 'overtime';
                  
                  return (
                    <tr key={worker.id} className="border-b">
                      <td className="py-2 px-4 font-medium">{worker.name}</td>
                      <td className="py-2 px-4 text-sm text-gray-500">{getSkillLabel(worker.skillType)}</td>
                      <td className="py-2 px-4">
                        <div className="flex gap-2">
                          <button 
                            className={`w-10 h-10 rounded font-bold ${isP ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            onClick={() => markAttendance(worker.id, 'present')}
                          >
                            P
                          </button>
                          <button 
                            className={`w-10 h-10 rounded font-bold ${isH ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                            onClick={() => markAttendance(worker.id, 'half_day')}
                          >
                            H
                          </button>
                          <button 
                            className={`w-10 h-10 rounded font-bold ${isA ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            onClick={() => markAttendance(worker.id, 'absent')}
                          >
                            A
                          </button>
                          <button 
                            className={`w-10 h-10 rounded font-bold ${isOT ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            onClick={() => markAttendance(worker.id, 'overtime')}
                          >
                            OT
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 pt-4 border-t flex gap-6 text-sm">
            <span className="font-semibold">Summary:</span>
            <span className="text-green-600">Present: {summary.p}</span>
            <span className="text-yellow-600">Half Day: {summary.h}</span>
            <span className="text-red-600">Absent: {summary.a}</span>
            <span className="text-blue-600">Overtime: {summary.ot}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

function WagesTab() {
  const [periodFrom, setPeriodFrom] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [periodTo, setPeriodTo] = useState(getTodayISO());
  
  const [wages, setWages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(getTodayISO());

  const calculateWages = async () => {
    setLoading(true);
    const res = await fetch(`/api/labour/wages/calculate?periodFrom=${periodFrom}&periodTo=${periodTo}`);
    if (res.ok) {
      setWages(await res.json());
    }
    setLoading(false);
  };

  const handlePayClick = (item: any) => {
    setSelectedWorker(item);
    setPayAmount(toRupees(item.pending).toString());
    setPayMode('cash');
    setPayRef('');
    setPayDate(getTodayISO());
    setIsModalOpen(true);
  };

  const handleRecordPayment = async () => {
    const amtPaise = toPaise(parseFloat(payAmount) || 0);
    if (amtPaise <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const data = {
      workerId: selectedWorker.worker.id,
      amount: amtPaise,
      paymentMode: payMode,
      reference: payRef,
      date: payDate,
      periodFrom,
      periodTo
    };

    const res = await fetch('/api/labour/wages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      setIsModalOpen(false);
      calculateWages(); // recalculate
    }
  };

  const columns = [
    { key: 'name', label: 'Worker Name', render: (row: any) => row.worker.name },
    { key: 'stats', label: 'Attendance', render: (row: any) => `${row.presentDays}P, ${row.halfDays}H, ${row.overtimeHours}OT` },
    { key: 'gross', label: 'Gross Wages', render: (row: any) => formatCurrency(row.grossWages) },
    { key: 'paid', label: 'Already Paid', render: (row: any) => formatCurrency(row.alreadyPaid) },
    { key: 'pending', label: 'Pending', render: (row: any) => (
      <span className={row.pending > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
        {formatCurrency(row.pending)}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (row: any) => (
      <Button 
        size="sm" 
        onClick={() => handlePayClick(row)}
        disabled={row.pending <= 0}
      >
        Pay
      </Button>
    )}
  ];

  return (
    <Card>
      <div className="flex gap-4 items-end mb-6">
        <div className="w-48">
          <Input label="From Date" type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
        </div>
        <div className="w-48">
          <Input label="To Date" type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
        </div>
        <Button onClick={calculateWages} disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate Wages'}
        </Button>
      </div>

      <DataTable 
        columns={columns}
        data={wages}
        emptyMessage={loading ? "Loading..." : "Click 'Calculate Wages' to view data."}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Record Payment: ${selectedWorker?.worker.name}`}>
        <div className="space-y-4">
          <Input 
            label="Amount (₹)" 
            type="number" 
            value={payAmount} 
            onChange={(e) => setPayAmount(e.target.value)} 
          />
          <Select 
            label="Payment Mode" 
            value={payMode} 
            onChange={(e) => setPayMode(e.target.value)}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'upi', label: 'UPI' },
              { value: 'bank_transfer', label: 'Bank Transfer' }
            ]}
          />
          <Input 
            label="Reference No (Optional)" 
            value={payRef} 
            onChange={(e) => setPayRef(e.target.value)} 
          />
          <Input 
            label="Payment Date" 
            type="date" 
            value={payDate} 
            onChange={(e) => setPayDate(e.target.value)} 
          />

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function ContractorsTab() {
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');

  const fetchContractors = async () => {
    setLoading(true);
    const res = await fetch('/api/labour/contractors');
    if (res.ok) setContractors(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleOpenModal = (contractor: any = null) => {
    setEditingContractor(contractor);
    if (contractor) {
      setName(contractor.name);
      setPhone(contractor.phone || '');
      setGstNumber(contractor.gstNumber || '');
      setAddress(contractor.address || '');
    } else {
      setName('');
      setPhone('');
      setGstNumber('');
      setAddress('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const data = { name, phone, gstNumber, address };
    const method = editingContractor ? 'PUT' : 'POST';
    const url = editingContractor ? `/api/labour/contractors/${editingContractor.id}` : '/api/labour/contractors';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchContractors();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contractor?')) {
      const res = await fetch(`/api/labour/contractors/${id}`, { method: 'DELETE' });
      if (res.ok) fetchContractors();
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone', render: (row: any) => row.phone || '-' },
    { key: 'gst', label: 'GST Number', render: (row: any) => row.gstNumber || '-' },
    { key: 'workers', label: 'Workers Count', render: (row: any) => row._count?.workers || 0 },
    { key: 'actions', label: 'Actions', render: (row: any) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
      </div>
    )}
  ];

  return (
    <Card 
      title="Contractors" 
      action={<Button onClick={() => handleOpenModal()}>Add Contractor</Button>}
    >
      <DataTable 
        columns={columns}
        data={contractors}
        emptyMessage={loading ? "Loading..." : "No contractors found."}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingContractor ? "Edit Contractor" : "Add Contractor"}
      >
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
          <Input label="GST Number" value={gstNumber} onChange={e => setGstNumber(e.target.value)} />
          <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} />
          
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
