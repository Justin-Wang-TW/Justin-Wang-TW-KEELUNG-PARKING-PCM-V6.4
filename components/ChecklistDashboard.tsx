import React, { useState } from 'react';
import { ChecklistSubmission, ChecklistItem, User, StationCode, CheckStatus, UserRole } from '../types';
import { STATIONS } from '../constants';
import { ClipboardList, Plus, Search, Settings, FileCheck, AlertCircle, Eye, ExternalLink, Image as ImageIcon } from 'lucide-react';
import ChecklistTemplateModal from './ChecklistTemplateModal';
import ChecklistSubmissionModal from './ChecklistSubmissionModal';

interface ChecklistDashboardProps {
  currentUser: User;
  submissions: ChecklistSubmission[];
  template: ChecklistItem[];
  onSaveTemplate: (items: ChecklistItem[]) => Promise<void>;
  onSubmitChecklist: (data: any) => Promise<void>;
}

const ChecklistDashboard: React.FC<ChecklistDashboardProps> = ({
  currentUser,
  submissions = [],
  template = [],
  onSaveTemplate,
  onSubmitChecklist
}) => {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<ChecklistSubmission | null>(null);

  const [filterStation, setFilterStation] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Permission Logic
  const isReadOnly = currentUser.role === UserRole.OPERATOR || currentUser.role === UserRole.MANAGER_DEPT;

  // Filter Submissions
  const filteredSubmissions = submissions.filter(sub => {
    const matchStation = filterStation === 'ALL' || sub.stationCode === filterStation;
    const matchMonth = filterMonth === '' || sub.yearMonth === filterMonth;
    
    const userStation = currentUser.assignedStation === 'ALL' ? 'ALL' : currentUser.assignedStation;
    if (userStation !== 'ALL' && sub.stationCode !== userStation) return false;

    return matchStation && matchMonth;
  });

  const handleOpenSubmission = () => {
    setIsSubmissionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center">
             <ClipboardList className="w-6 h-6 mr-2 text-blue-600" />
             每月場館檢核表
           </h2>
           <p className="text-gray-500 mt-1">
             定期檢視停車場環境、設備與服務品質
           </p>
        </div>
        <div className="flex gap-2">
          {!isReadOnly && (
            <>
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors shadow-sm border border-gray-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                管理檢核項目
              </button>
              <button
                onClick={handleOpenSubmission}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                填寫本月檢核
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1 font-bold">檢核月份</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full p-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 font-bold">場站篩選</label>
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            disabled={currentUser.assignedStation !== 'ALL'}
            className="w-full p-2 border rounded-lg bg-white disabled:bg-gray-100"
          >
            <option value="ALL">所有場站</option>
            {STATIONS.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">檢核月份</th>
                <th className="px-6 py-4 font-semibold text-gray-600">場站</th>
                <th className="px-6 py-4 font-semibold text-gray-600">填表人</th>
                <th className="px-6 py-4 font-semibold text-gray-600">填表時間</th>
                <th className="px-6 py-4 font-semibold text-gray-600">異常項目數</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    此月份尚無檢核紀錄
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const issueCount = sub.results.filter(r => r.status === CheckStatus.ISSUE).length;
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-gray-700">
                        {sub.yearMonth}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {sub.stationName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{sub.submittedBy}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {issueCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {issueCount} 項異常
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                            <FileCheck className="w-3 h-3 mr-1" />
                            全數正常
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setViewingSubmission(sub)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end w-full"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          檢視詳情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isReadOnly && (
        <ChecklistTemplateModal 
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          initialItems={template}
          onSave={onSaveTemplate}
        />
      )}

      {!isReadOnly && (
        <ChecklistSubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => setIsSubmissionModalOpen(false)}
          currentUser={currentUser}
          template={template}
          onSubmit={onSubmitChecklist}
          onManageTemplate={() => setIsTemplateModalOpen(true)}
        />
      )}

      {/* View Details Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in">
             <div className="p-5 border-b bg-gray-50 rounded-t-xl flex justify-between items-center">
                <div>
                   <h3 className="text-xl font-bold text-gray-800">
                     {viewingSubmission.yearMonth} 場館檢核詳情
                   </h3>
                   <p className="text-sm text-gray-500 mt-1">
                     {viewingSubmission.stationName} - 填表人: {viewingSubmission.submittedBy}
                   </p>
                </div>
                <button onClick={() => setViewingSubmission(null)}><div className="p-2 hover:bg-gray-200 rounded-full"><Plus className="w-6 h-6 rotate-45 text-gray-500" /></div></button>
             </div>
             <div className="p-6 overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                   <thead>
                      <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                         <th className="p-3 text-left w-[15%]">類別</th>
                         <th className="p-3 text-left w-[35%]">檢查項目</th>
                         <th className="p-3 text-center w-[10%]">結果</th>
                         <th className="p-3 text-left w-[25%]">備註說明</th>
                         <th className="p-3 text-right w-[15%]">佐證照片</th>
                      </tr>
                   </thead>
                   <tbody>
                      {viewingSubmission.results.map((res, idx) => {
                         const itemDef = template.find(t => t.id === res.itemId);
                         const displayCategory = res.category || itemDef?.category || '未分類';
                         const displayContent = res.content || itemDef?.content || '未知項目';
                         
                         return (
                            <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                               <td className="p-3 font-medium text-gray-500 align-top">{displayCategory}</td>
                               <td className="p-3 text-gray-800 align-top">{displayContent}</td>
                               <td className="p-3 text-center align-top">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block ${
                                     res.status === CheckStatus.ISSUE ? 'bg-red-100 text-red-700' : 
                                     res.status === CheckStatus.NA ? 'bg-gray-100 text-gray-600' :
                                     'bg-green-100 text-green-700'
                                  }`}>
                                     {res.status}
                                  </span>
                               </td>
                               <td className="p-3 text-gray-600 align-top break-all">{res.note || '-'}</td>
                               <td className="p-3 text-right align-top">
                                  {res.photoUrl ? (
                                    <a 
                                      href={res.photoUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 border border-blue-200 transition-colors"
                                    >
                                      <ImageIcon className="w-3 h-3 mr-1" />
                                      檢視照片
                                    </a>
                                  ) : (
                                    <span className="text-gray-300 text-xs">-</span>
                                  )}
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
             <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                <button onClick={() => setViewingSubmission(null)} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">關閉</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChecklistDashboard;