"use client";

import { useState, useEffect } from "react";
import { 
  Card, Button, Modal, DataTable, Badge, Input, Select, TextArea, 
  Tabs, SearchBar, ConfirmDialog 
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

// Define some types based on assumed schema
type Material = {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  lastPrice: number;
  gstRate: number;
  hsnCode: string;
};

type StockTransaction = {
  id: string;
  materialId: string;
  type: "stock_in" | "stock_out";
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  date: string;
  projectId?: string;
  vendorId?: string;
  notes?: string;
  material?: { name: string; unit: string };
  project?: { name: string };
  vendor?: { name: string };
};

// Helper since utils isn't fully defined here
const getMaterialCategoryLabel = (cat: string) => {
  const categories: Record<string, string> = {
    cement: "Cement",
    steel: "Steel",
    sand: "Sand",
    aggregates: "Aggregates",
    bricks: "Bricks & Blocks",
    electrical: "Electrical",
    plumbing: "Plumbing",
    wood: "Wood & Timber",
    paints: "Paints & Finishes",
    other: "Other"
  };
  return categories[cat] || cat;
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("materials");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals state
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"stock_in" | "stock_out">("stock_in");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Forms state
  const [materialForm, setMaterialForm] = useState({
    name: "", category: "cement", unit: "kg", currentStock: 0, minimumStock: 0, 
    lastPrice: 0, gstRate: 18, hsnCode: ""
  });

  const [transactionForm, setTransactionForm] = useState({
    materialId: "", quantity: 0, pricePerUnit: 0, projectId: "", vendorId: "", date: new Date().toISOString().split('T')[0], notes: ""
  });

  useEffect(() => {
    fetchData();
    fetchProjectsAndVendors();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matRes, transRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/inventory/transactions")
      ]);
      if (matRes.ok) setMaterials(await matRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsAndVendors = async () => {
    try {
      const [projRes, vendRes] = await Promise.all([
        fetch("/api/projects").catch(() => null),
        fetch("/api/vendors").catch(() => null)
      ]);
      if (projRes?.ok) setProjects(await projRes.json());
      if (vendRes?.ok) setVendors(await vendRes.json());
    } catch (error) {
      console.error("Failed to fetch relations:", error);
    }
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...materialForm,
        lastPrice: materialForm.lastPrice * 100 // Convert ₹ to paise
      };
      
      const res = await fetch("/api/inventory" + (selectedMaterial ? `/${selectedMaterial.id}` : ""), {
        method: selectedMaterial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsMaterialModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to save material:", error);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...transactionForm,
        type: transactionType,
        pricePerUnit: transactionForm.pricePerUnit * 100 // Convert ₹ to paise
      };

      const res = await fetch("/api/inventory/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsTransactionModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  };

  // Materials Filtering
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockMaterials = materials.filter(m => m.currentStock < m.minimumStock);

  // Table Columns
  const materialColumns = [
    { key: "name", label: "Name" },
    { key: "category", label: "Category", render: (item: any) => getMaterialCategoryLabel(item.category) },
    { 
      key: "currentStock", 
      label: "Current Stock",
      render: (item: any) => (
        <span className={item.currentStock < item.minimumStock ? "text-red-600 font-medium" : ""}>
          {item.currentStock} {item.unit}
        </span>
      )
    },
    { key: "minimumStock", label: "Min Stock", render: (item: any) => `${item.minimumStock} ${item.unit}` },
    { key: "lastPrice", label: "Last Price", render: (item: any) => `${formatCurrency(item.lastPrice)}/${item.unit}` },
    { key: "actions", label: "Actions", render: (item: any) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={(e) => {
          e.stopPropagation();
          setSelectedMaterial(item);
          setMaterialForm({
            ...item,
            lastPrice: item.lastPrice / 100 // paise to ₹
          });
          setIsMaterialModalOpen(true);
        }}>Edit</Button>
      </div>
    )}
  ];

  const transactionColumns = [
    { key: "date", label: "Date", render: (item: any) => formatDate(item.date) },
    { key: "material", label: "Material", render: (item: any) => item.material?.name },
    { 
      key: "type", 
      label: "Type", 
      render: (item: any) => (
        <Badge variant={item.type === "stock_in" ? "success" : "danger"}>
          {item.type === "stock_in" ? "Stock In" : "Stock Out"}
        </Badge>
      )
    },
    { key: "quantity", label: "Qty", render: (item: any) => `${item.quantity} ${item.material?.unit || ""}` },
    { key: "pricePerUnit", label: "Rate", render: (item: any) => formatCurrency(item.pricePerUnit) },
    { key: "totalAmount", label: "Total", render: (item: any) => formatCurrency(item.totalAmount) },
    { key: "project", label: "Project", render: (item: any) => item.project?.name || "-" },
    { key: "vendor", label: "Vendor", render: (item: any) => item.vendor?.name || "-" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory & Materials</h1>
      </div>

      <Tabs 
        tabs={[
          { key: "materials", label: "Materials" },
          { key: "transactions", label: "Stock In/Out" },
          { key: "low_stock", label: "Low Stock Alerts" }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "materials" && (
        <Card>
          <div className="p-4 flex gap-4 justify-between bg-gray-50 border-b">
            <div className="flex gap-4 flex-1">
              <div className="w-64">
                <SearchBar 
                  value={searchQuery} 
                  onChange={setSearchQuery} 
                  placeholder="Search materials..." 
                />
              </div>
              <Select
                label=""
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Categories" },
                  { value: "cement", label: "Cement" },
                  { value: "steel", label: "Steel" },
                  { value: "sand", label: "Sand" },
                  { value: "aggregates", label: "Aggregates" },
                  { value: "bricks", label: "Bricks & Blocks" },
                ]}
              />
            </div>
            <Button onClick={() => {
              setSelectedMaterial(null);
              setMaterialForm({
                name: "", category: "cement", unit: "kg", currentStock: 0, minimumStock: 0, 
                lastPrice: 0, gstRate: 18, hsnCode: ""
              });
              setIsMaterialModalOpen(true);
            }}>+ Add Material</Button>
          </div>
          <DataTable 
            columns={materialColumns}
            data={filteredMaterials}
            onRowClick={(item) => {
              setSelectedMaterial(item);
              setIsDetailModalOpen(true);
            }}
            emptyMessage="No materials found."
          />
        </Card>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <Button 
              className="flex-1 py-8 text-lg" 
              variant="success"
              onClick={() => {
                setTransactionType("stock_in");
                setTransactionForm({ materialId: "", quantity: 0, pricePerUnit: 0, projectId: "", vendorId: "", date: new Date().toISOString().split('T')[0], notes: "" });
                setIsTransactionModalOpen(true);
              }}
            >
              📥 Stock In
            </Button>
            <Button 
              className="flex-1 py-8 text-lg" 
              variant="danger"
              onClick={() => {
                setTransactionType("stock_out");
                setTransactionForm({ materialId: "", quantity: 0, pricePerUnit: 0, projectId: "", vendorId: "", date: new Date().toISOString().split('T')[0], notes: "" });
                setIsTransactionModalOpen(true);
              }}
            >
              📤 Stock Out
            </Button>
          </div>
          
          <Card title="Recent Transactions">
            <DataTable 
              columns={transactionColumns}
              data={transactions}
              emptyMessage="No transactions yet."
            />
          </Card>
        </div>
      )}

      {activeTab === "low_stock" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lowStockMaterials.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg shadow">
              All materials are adequately stocked!
            </div>
          ) : (
            lowStockMaterials.map(item => (
              <Card key={item.id} title={item.name}>
                <div className="space-y-4 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Current Stock</span>
                    <span className="text-xl font-bold text-red-600">{item.currentStock} {item.unit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Minimum Stock</span>
                    <span className="font-medium">{item.minimumStock} {item.unit}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-500">Deficit</span>
                    <span className="font-medium text-orange-600">{item.minimumStock - item.currentStock} {item.unit}</span>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => window.location.href = '/vendors'}
                  >
                    Create Purchase Order
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Material Form Modal */}
      <Modal 
        isOpen={isMaterialModalOpen} 
        onClose={() => setIsMaterialModalOpen(false)}
        title={selectedMaterial ? "Edit Material" : "Add New Material"}
      >
        <form onSubmit={handleMaterialSubmit} className="space-y-4">
          <Input label="Material Name" value={materialForm.name} onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Category" 
              value={materialForm.category} 
              onChange={(e) => setMaterialForm({...materialForm, category: e.target.value})}
              options={[
                { value: "cement", label: "Cement" },
                { value: "steel", label: "Steel" },
                { value: "sand", label: "Sand" },
                { value: "aggregates", label: "Aggregates" },
                { value: "bricks", label: "Bricks & Blocks" },
              ]}
            />
            <Input label="Unit (e.g. kg, bags, tons)" value={materialForm.unit} onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Current Stock" type="number" value={materialForm.currentStock.toString()} onChange={(e) => setMaterialForm({...materialForm, currentStock: Number(e.target.value)})} required />
            <Input label="Minimum Stock" type="number" value={materialForm.minimumStock.toString()} onChange={(e) => setMaterialForm({...materialForm, minimumStock: Number(e.target.value)})} required />
          </div>
          <Input label="Price per Unit (₹)" type="number" value={materialForm.lastPrice.toString()} onChange={(e) => setMaterialForm({...materialForm, lastPrice: Number(e.target.value)})} required />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsMaterialModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Form Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={transactionType === "stock_in" ? "Stock In" : "Stock Out"}
      >
        <form onSubmit={handleTransactionSubmit} className="space-y-4">
          <Select 
            label="Material" 
            value={transactionForm.materialId}
            onChange={(e) => {
              const val = e.target.value;
              const mat = materials.find(m => m.id === val);
              setTransactionForm({
                ...transactionForm, 
                materialId: val,
                pricePerUnit: transactionType === "stock_in" && mat ? mat.lastPrice / 100 : transactionForm.pricePerUnit
              });
            }}
            options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.currentStock} ${m.unit} available)` }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity" type="number" value={transactionForm.quantity.toString()} onChange={(e) => setTransactionForm({...transactionForm, quantity: Number(e.target.value)})} required />
            <Input label="Price per Unit (₹)" type="number" value={transactionForm.pricePerUnit.toString()} onChange={(e) => setTransactionForm({...transactionForm, pricePerUnit: Number(e.target.value)})} required />
          </div>
          <Input label="Date" type="date" value={transactionForm.date} onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})} required />
          
          <Select
            label="Project (Optional)"
            value={transactionForm.projectId}
            onChange={(e) => setTransactionForm({...transactionForm, projectId: e.target.value})}
            options={[{value: "", label: "Select Project..."}, ...projects.map(p => ({ value: p.id, label: p.name }))]}
          />

          {transactionType === "stock_in" && (
            <Select
              label="Vendor (Optional)"
              value={transactionForm.vendorId}
              onChange={(e) => setTransactionForm({...transactionForm, vendorId: e.target.value})}
              options={[{value: "", label: "Select Vendor..."}, ...vendors.map(v => ({ value: v.id, label: v.name }))]}
            />
          )}

          <TextArea label="Notes" value={transactionForm.notes} onChange={(e) => setTransactionForm({...transactionForm, notes: e.target.value})} />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsTransactionModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Modal>
      
      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedMaterial?.name || "Material Details"}
        size="lg"
      >
        {selectedMaterial && (
          <div className="space-y-4">
             <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{getMaterialCategoryLabel(selectedMaterial.category)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Stock</p>
                  <p className="font-medium">{selectedMaterial.currentStock} {selectedMaterial.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Price</p>
                  <p className="font-medium">{formatCurrency(selectedMaterial.lastPrice)}</p>
                </div>
             </div>
             <h3 className="text-lg font-medium">Recent Transactions</h3>
             <DataTable 
                columns={[
                  { key: "date", label: "Date", render: (item: any) => formatDate(item.date) },
                  { 
                    key: "type", 
                    label: "Type", 
                    render: (item: any) => (
                      <Badge variant={item.type === "stock_in" ? "success" : "danger"}>
                        {item.type === "stock_in" ? "In" : "Out"}
                      </Badge>
                    )
                  },
                  { key: "quantity", label: "Qty", render: (item: any) => `${item.quantity} ${selectedMaterial.unit}` },
                  { key: "project", label: "Project", render: (item: any) => item.project?.name || "-" },
                ]}
                data={transactions.filter(t => t.materialId === selectedMaterial.id).slice(0, 5)}
                emptyMessage="No recent transactions."
             />
          </div>
        )}
      </Modal>
    </div>
  );
}
