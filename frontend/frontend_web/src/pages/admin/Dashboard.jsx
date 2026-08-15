import React, { useState, useEffect } from 'react';
import { pageService } from '../../api/pageService';

// Hooks
import { useAccountability } from "../../hooks/useAccountability";
import { useAdminAgeVerification } from "../../hooks/useAdminAgeVerification";

// Components
import AccountabilityTable from "../../components/admin/AccountabilityTable";
import StorageSummaryCard from "../../components/admin/StorageSummaryCard";
import AgeVerificationLookup from "../../components/admin/AgeVerificationLookup";
import Spinner from "../../components/common/Spinner";
import ErrorBanner from "../../components/common/ErrorBanner";

const Dashboard = () => {
  // --- Accountability Hook State ---
  const { 
    records, 
    storage, 
    isLoading: accountabilityLoading, 
    error: accountabilityError, 
    refetch: refetchAccountability 
  } = useAccountability();

  // --- Age Verification Hook State ---
  const { 
    status: ageStatus, 
    isLoading: ageLoading, 
    isRevoking: ageRevoking, 
    error: ageError, 
    lookup: lookupAge, 
    revoke: revokeAge 
  } = useAdminAgeVerification();

  // --- Content Management State ---
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [newPage, setNewPage] = useState({ title: '', slug: '' });
  const [selectedPageId, setSelectedPageId] = useState('');
  const [newSection, setNewSection] = useState({ title: '', content: '' });
  const [savingPage, setSavingPage] = useState(false);
  const [savingSection, setSavingSection] = useState(false);

  // Load Content Dashboard Data
  const loadDashboardData = async () => {
    setPagesLoading(true);
    try {
      const data = await pageService.getAllPages();
      setPages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setPagesLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Combined Global Refresh
  const handleRefreshAll = () => {
    loadDashboardData();
    refetchAccountability();
  };

  // --- Content Action Handlers ---
  const handleCreatePage = async (e) => {
    e.preventDefault();
    setSavingPage(true);
    try {
      await pageService.createPage(newPage);
      setNewPage({ title: '', slug: '' });
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create the page. Please try again.');
    } finally {
      setSavingPage(false);
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!selectedPageId) return alert('Choose a page to add this section to.');
    setSavingSection(true);
    try {
      await pageService.addSection(selectedPageId, newSection);
      setNewSection({ title: '', content: '' });
      await loadDashboardData();
    } catch (err) {
      alert('Could not add the section. Please try again.');
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Delete this page and all its sections? This cannot be undone.')) return;
    try {
      await pageService.deletePage(pageId);
      loadDashboardData();
    } catch (err) {
      alert('Could not delete the page. Please try again.');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await pageService.deleteSection(sectionId);
      loadDashboardData();
    } catch (err) {
      alert('Could not delete the section. Please try again.');
    }
  };

  return (
    <div className="h-screen overflow-y-auto dashboard-scroll bg-slate-50">
      <style>{`
        .dashboard-scroll::-webkit-scrollbar { width: 8px; }
        .dashboard-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
        .dashboard-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .dashboard-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dashboard-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f1f5f9; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header Unit */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">System & Content Console</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage content layouts, user access verification, and monitor video infrastructure.
            </p>
          </div>
          <button 
            onClick={handleRefreshAll}
            className="self-start sm:self-center px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all"
          >
            Refresh Dashboard
          </button>
        </div>

        {/* Top Analytics Panel (Accountability Storage Metrics) */}
        <div className="mb-8">
          {accountabilityLoading && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 flex justify-center shadow-sm">
              <Spinner label="Loading accountability data" />
            </div>
          )}
          {accountabilityError && (
            <ErrorBanner error={accountabilityError} onRetry={refetchAccountability} />
          )}
          {!accountabilityLoading && !accountabilityError && storage && (
            <StorageSummaryCard storage={storage} />
          )}
        </div>

        {/* Three-Column Workspace Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Action Controls (xl: span 4) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            
            {/* Age Verification Control */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 border-t-4 border-t-red-500">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Access Management</h2>
              <h3 className="text-base font-semibold text-slate-900">Age Verification</h3>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Inspect or revoke a user's 18+ content access.
              </p>
              
              {ageError && (
                <div className="mb-4">
                  <ErrorBanner error={ageError} />
                </div>
              )}
              
              <AgeVerificationLookup
                status={ageStatus}
                isLoading={ageLoading}
                isRevoking={ageRevoking}
                onLookup={lookupAge}
                onRevoke={revokeAge}
              />
            </div>

            {/* Form: Create a page */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Content Structuring</h2>
              <h3 className="text-base font-semibold text-slate-900">Create a new page</h3>
              <form onSubmit={handleCreatePage} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={newPage.title}
                    onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                    placeholder="e.g., About Us"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Slug</label>
                  <div className="flex items-center rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden">
                    <span className="px-3 text-sm text-slate-400 bg-slate-50 border-r border-slate-300 select-none">/</span>
                    <input
                      type="text"
                      value={newPage.slug}
                      onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                      placeholder="about-us"
                      className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingPage}
                  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium py-2.5 transition-colors shadow-sm"
                >
                  {savingPage ? 'Creating…' : 'Create page'}
                </button>
              </form>
            </div>

            {/* Form: Add a section */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-slate-900">Add a layout section</h3>
              <p className="text-xs text-slate-500 mt-0.5">Attach content blocks directly onto your live paths.</p>
              <form onSubmit={handleAddSection} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Destination</label>
                  <select
                    value={selectedPageId}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  >
                    <option value="">Select a page…</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (/{p.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Section Title</label>
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    placeholder="e.g., Hero Segment"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Markdown Content Body</label>
                  <textarea
                    value={newSection.content}
                    onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                    placeholder="Input descriptive syntax or plain raw text block contents..."
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingSection}
                  className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-medium py-2.5 transition-colors shadow-sm"
                >
                  {savingSection ? 'Injecting Segment…' : 'Add section'}
                </button>
              </form>
            </div>
          </div>

          {/* Column 2 & 3 Data Area (xl: span 8) */}
          <div className="xl:col-span-8 flex flex-col gap-8">
            
            {/* Page Tree Structural Flow */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Active Map Routing</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Interactive configuration structure nodes.</p>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                  {pages.length} {pages.length === 1 ? 'Page Node' : 'Page Nodes'}
                </span>
              </div>

              {pagesLoading ? (
                <div className="py-12 text-center text-sm text-slate-400 font-medium">Synchronizing routing nodes…</div>
              ) : pages.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">No layout endpoints mapped</p>
                  <p className="text-xs text-slate-400 mt-0.5">Incorporate layout roots on your control deck.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto dashboard-scroll pr-1">
                  {pages.map((page) => (
                    <div key={page.id} className="border border-slate-200 bg-slate-50/50 rounded-lg p-4 hover:bg-white hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{page.title}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">/{page.slug}</p>
                        </div>
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="shrink-0 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-md px-2.5 py-1.5 transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-3 pl-3 border-l-2 border-slate-200 space-y-1.5">
                        {page.sections && page.sections.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {page.sections.map((sec) => (
                              <div
                                key={sec.id}
                                className="flex items-center gap-2 bg-white border border-slate-200 shadow-2xs rounded-md pl-2.5 pr-1.5 py-1 text-xs"
                              >
                                <span className="text-slate-600 font-medium truncate max-w-[120px]">{sec.title}</span>
                                <button
                                  onClick={() => handleDeleteSection(sec.id)}
                                  aria-label={`Delete section ${sec.title}`}
                                  className="shrink-0 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded px-1 transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No structural sub-segments attached.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accountability Logs Matrix */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 overflow-hidden">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-900">Upload accountability metrics</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit tracking for video assets, user assignment origins, and system capacity footprints.
                </p>
              </div>
              
              {!accountabilityLoading && !accountabilityError && records && (
                <div className="overflow-x-auto -mx-6 px-6">
                  <AccountabilityTable records={records} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;