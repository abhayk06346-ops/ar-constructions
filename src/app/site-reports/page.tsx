"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Input, Select, TextArea, Badge, Tabs, EmptyState, ConfirmDialog, PageHeader } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function SiteReportsPage() {
  const [activeTab, setActiveTab] = useState('reports');
  const [projects, setProjects] = useState<any[]>([]);
  
  // Daily Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    weather: 'clear',
    workDone: '',
    labourCount: '',
    materialsUsed: '',
    issues: '',
  });
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Photos State
  const [photos, setPhotos] = useState<any[]>([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoForm, setPhotoForm] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    tags: '',
  });
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // View Photo State
  const [viewingPhoto, setViewingPhoto] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
    fetchReports();
    fetchPhotos();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedProjectId, startDate, endDate]);

  useEffect(() => {
    fetchPhotos();
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };

  const fetchReports = async () => {
    try {
      let url = '/api/site-reports?';
      if (selectedProjectId) url += `projectId=${selectedProjectId}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      
      const res = await fetch(url);
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      let url = '/api/site-reports/photos?';
      if (selectedProjectId) url += `projectId=${selectedProjectId}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setPhotos(data);
    } catch (error) {
      console.error('Failed to fetch photos', error);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...reportForm,
        labourCount: parseInt(reportForm.labourCount) || 0,
      };
      const res = await fetch('/api/site-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsReportModalOpen(false);
        fetchReports();
        setReportForm({
          projectId: '',
          date: new Date().toISOString().split('T')[0],
          weather: 'clear',
          workDone: '',
          labourCount: '',
          materialsUsed: '',
          issues: '',
        });
      } else {
        const errorData = await res.json();
        alert(`Failed to save report: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to save report', error);
      alert('Network error while saving report.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) {
      alert("Please select a photo");
      return;
    }
    try {
      const res = await fetch('/api/site-reports/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...photoForm, filePath: photoBase64 }),
      });
      if (res.ok) {
        setIsPhotoModalOpen(false);
        fetchPhotos();
        setPhotoForm({
          projectId: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          tags: '',
        });
        setPhotoBase64('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload photo', error);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        await fetch(`/api/site-reports/${id}`, { method: 'DELETE' });
        fetchReports();
      } catch (error) {
        console.error('Failed to delete report', error);
      }
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      try {
        await fetch(`/api/site-reports/photos/${id}`, { method: 'DELETE' });
        setViewingPhoto(null);
        fetchPhotos();
      } catch (error) {
        console.error('Failed to delete photo', error);
      }
    }
  };

  const projectOptions = projects.map(p => ({ value: p.id, label: p.name }));
  const filterProjectOptions = [{ value: '', label: 'All Projects' }, ...projectOptions];
  
  const weatherOptions = [
    { value: 'clear', label: '☀️ Clear' },
    { value: 'cloudy', label: '☁️ Cloudy' },
    { value: 'rainy', label: '🌧️ Rainy' },
    { value: 'hot', label: '🌡️ Hot' },
    { value: 'cold', label: '❄️ Cold' },
  ];

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'clear': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'hot': return '🌡️';
      case 'cold': return '❄️';
      default: return '☀️';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Site Reports</h1>
      </div>

      <Tabs 
        tabs={[
          { key: 'reports', label: 'Daily Reports' },
          { key: 'photos', label: 'Photo Gallery' }
        ]} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <div className="mt-6">
        {activeTab === 'reports' && (
          <div>
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
              <div className="w-full md:w-1/3">
                <Select
                  label="Filter by Project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  options={filterProjectOptions}
                />
              </div>
              <div className="w-full md:w-1/4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/4">
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="w-full md:w-auto flex items-end ml-auto">
                <Button onClick={() => setIsReportModalOpen(true)} className="w-full md:w-auto">
                  New Report
                </Button>
              </div>
            </div>

            {reports.length === 0 ? (
              <EmptyState
                icon="📄"
                title="No reports found"
                description="Create a new daily site report to get started."
                action={<Button onClick={() => setIsReportModalOpen(true)}>Create Report</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reports.map((report) => (
                  <div key={report.id} className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                    <div 
                      className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{formatDate(report.date)}</h3>
                          <p className="text-gray-500 font-medium">{report.project?.name || 'Unknown Project'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl" title={report.weather}>{getWeatherIcon(report.weather)}</span>
                          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}>
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 font-medium mb-1">Work Done:</p>
                        <p className={`text-gray-800 ${expandedReportId !== report.id ? 'line-clamp-2' : ''}`}>
                          {report.workDone}
                        </p>
                      </div>

                      {report.issues && (
                        <div className="mt-3 flex items-start">
                          <Badge variant="danger">Issues</Badge>
                          <span className="ml-2 text-sm text-red-600 line-clamp-1">{report.issues}</span>
                        </div>
                      )}
                    </div>
                    
                    {expandedReportId === report.id && (
                      <div className="p-5 border-t border-gray-100 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Labour Count</p>
                            <p className="font-semibold">{report.labourCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Weather</p>
                            <p className="capitalize">{report.weather}</p>
                          </div>
                        </div>
                        
                        {report.materialsUsed && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Materials Used</p>
                            <p className="text-sm">{report.materialsUsed}</p>
                          </div>
                        )}
                        
                        {report.issues && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 text-red-500">Blockers & Issues</p>
                            <p className="text-sm text-red-700">{report.issues}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between mb-6 bg-white p-4 rounded-lg shadow-sm gap-4">
              <div className="w-full md:w-1/3">
                <Select
                  label="Filter by Project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  options={filterProjectOptions}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={() => setIsPhotoModalOpen(true)}>Upload Photo</Button>
              </div>
            </div>

            {photos.length === 0 ? (
              <EmptyState
                icon="📸"
                title="No photos found"
                description="Upload site photos to document progress."
                action={<Button onClick={() => setIsPhotoModalOpen(true)}>Upload Photo</Button>}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setViewingPhoto(photo)}
                  >
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      <img 
                        src={photo.filePath} 
                        alt={photo.description || 'Site photo'} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-500 mb-1">{formatDate(photo.date)}</p>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{photo.project?.name}</p>
                      {photo.description && (
                        <p className="text-xs text-gray-600 line-clamp-1 mt-1">{photo.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="New Daily Report" size="lg">
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Project"
              value={reportForm.projectId}
              onChange={(e) => setReportForm({ ...reportForm, projectId: e.target.value })}
              options={projectOptions}
              required
            />
            <Input
              label="Date"
              type="date"
              value={reportForm.date}
              onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Weather"
              value={reportForm.weather}
              onChange={(e) => setReportForm({ ...reportForm, weather: e.target.value })}
              options={weatherOptions}
            />
            <Input
              label="Labour Count"
              type="number"
              value={reportForm.labourCount}
              onChange={(e) => setReportForm({ ...reportForm, labourCount: e.target.value })}
            />
          </div>

          <TextArea
            label="Work Done"
            value={reportForm.workDone}
            onChange={(e) => setReportForm({ ...reportForm, workDone: e.target.value })}
            placeholder="Describe the work completed today..."
            rows={3}
            required
          />

          <TextArea
            label="Materials Used"
            value={reportForm.materialsUsed}
            onChange={(e) => setReportForm({ ...reportForm, materialsUsed: e.target.value })}
            placeholder="List materials consumed..."
            rows={2}
          />

          <TextArea
            label="Issues / Blockers"
            value={reportForm.issues}
            onChange={(e) => setReportForm({ ...reportForm, issues: e.target.value })}
            placeholder="Any delays, accidents, or issues?"
            rows={2}
          />

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Report</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Photo Modal */}
      <Modal isOpen={isPhotoModalOpen} onClose={() => setIsPhotoModalOpen(false)} title="Upload Site Photo">
        <form onSubmit={handlePhotoSubmit} className="space-y-4">
          <Select
            label="Project"
            value={photoForm.projectId}
            onChange={(e) => setPhotoForm({ ...photoForm, projectId: e.target.value })}
            options={projectOptions}
            required
          />
          
          <Input
            label="Date"
            type="date"
            value={photoForm.date}
            onChange={(e) => setPhotoForm({ ...photoForm, date: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>

          {photoBase64 && (
            <div className="mt-2 h-32 w-full overflow-hidden rounded bg-gray-100 flex items-center justify-center">
              <img src={photoBase64} alt="Preview" className="h-full object-contain" />
            </div>
          )}

          <TextArea
            label="Caption / Description"
            value={photoForm.description}
            onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
            rows={2}
          />

          <Input
            label="Tags (comma separated)"
            value={photoForm.tags}
            onChange={(e) => setPhotoForm({ ...photoForm, tags: e.target.value })}
            placeholder="e.g. foundation, concrete, issue"
          />

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsPhotoModalOpen(false)}>Cancel</Button>
            <Button type="submit">Upload</Button>
          </div>
        </form>
      </Modal>

      {/* View Photo Modal */}
      <Modal 
        isOpen={!!viewingPhoto} 
        onClose={() => setViewingPhoto(null)} 
        title={viewingPhoto?.project?.name || 'Site Photo'}
        size="lg"
      >
        {viewingPhoto && (
          <div>
            <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center mb-4" style={{ maxHeight: '60vh' }}>
              <img 
                src={viewingPhoto.filePath} 
                alt={viewingPhoto.description || 'Site photo'} 
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{formatDate(viewingPhoto.date)}</p>
                {viewingPhoto.description && (
                  <p className="mt-2 text-gray-800">{viewingPhoto.description}</p>
                )}
                {viewingPhoto.tags && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {viewingPhoto.tags.split(',').map((tag: string, i: number) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="danger" onClick={() => handleDeletePhoto(viewingPhoto.id)}>
                Delete Photo
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
