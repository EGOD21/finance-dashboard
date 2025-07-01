'use client';

import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface MonthlyData {
  month: string;
  charges: number;
  receipts_received_before_statement: number;
  receipts_requested: number;
  additional_received: number;
  still_missing: number;
  notes: string;
}

interface PersonInfo {
  internal_id: number;
  name: string;
  card_last_4: string;
}

interface PersonData {
  person_info: PersonInfo;
  monthly_data: MonthlyData[];
}

export default function Dashboard() {
  const [allPeopleData, setAllPeopleData] = useState<PersonData[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<MonthlyData | null>(null);

  useEffect(() => {
    fetch('/all_people_data.json')
      .then(res => res.json())
      .then((data: PersonData[]) => {
        setAllPeopleData(data);
        if (data.length > 0) {
          setSelectedPerson(data[0]);
        }
      })
      .catch(err => console.error('Error loading data:', err));
  }, []);

  const monthlyData = selectedPerson?.monthly_data || [];
  
  // Filter out empty months (where no charges occurred)
  const activeMonths = monthlyData.filter(month => month.charges > 0);

  const chartData = {
    labels: activeMonths.map(month => month.month),
    datasets: [
      {
        label: 'Charges',
        data: activeMonths.map(month => month.charges),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Still Missing',
        data: activeMonths.map(month => month.still_missing),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: ['Received', 'Still Missing'],
    datasets: [
      {
        data: [
          activeMonths.reduce((sum, month) => sum + month.receipts_received_before_statement, 0),
          activeMonths.reduce((sum, month) => sum + month.still_missing, 0),
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.5)', 'rgba(239, 68, 68, 0.5)'],
        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const handleEdit = (index: number) => {
    setEditingId(index);
    setEditData({ ...activeMonths[index] });
  };

  const handleSave = () => {
    if (editingId !== null && editData && selectedPerson) {
      const updatedPeople = allPeopleData.map(person => {
        if (person.person_info.internal_id === selectedPerson.person_info.internal_id) {
          const updatedMonthlyData = person.monthly_data.map(month => 
            month.month === editData.month ? editData : month
          );
          return { ...person, monthly_data: updatedMonthlyData };
        }
        return person;
      });
      
      setAllPeopleData(updatedPeople);
      setSelectedPerson(updatedPeople.find(p => p.person_info.internal_id === selectedPerson.person_info.internal_id) || null);
      setEditingId(null);
      setEditData(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Credit Card Receipt Dashboard</h1>
        
        {/* Person Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee:</label>
          <select 
            value={selectedPerson?.person_info.internal_id || ''} 
            onChange={(e) => {
              const person = allPeopleData.find(p => p.person_info.internal_id === parseInt(e.target.value));
              setSelectedPerson(person || null);
            }}
            className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {allPeopleData.map(person => (
              <option key={person.person_info.internal_id} value={person.person_info.internal_id}>
                {person.person_info.name} (ID: {person.person_info.internal_id}, Card: *{person.person_info.card_last_4})
              </option>
            ))}
          </select>
        </div>
        
        {selectedPerson && (
          <>
            {/* Employee Info */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-2">{selectedPerson.person_info.name}</h2>
              <p className="text-gray-600">Employee ID: {selectedPerson.person_info.internal_id}</p>
              <p className="text-gray-600">Card Last 4: *{selectedPerson.person_info.card_last_4}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Active Months</h3>
                <p className="text-3xl font-bold text-blue-600">{activeMonths.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Total Charges</h3>
                <p className="text-3xl font-bold text-green-600">
                  {activeMonths.reduce((sum, month) => sum + month.charges, 0)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Missing Receipts</h3>
                <p className="text-3xl font-bold text-red-600">
                  {activeMonths.reduce((sum, month) => sum + month.still_missing, 0)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">Completion Rate</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {activeMonths.length > 0 ? 
                    Math.round((activeMonths.reduce((sum, month) => sum + month.receipts_received_before_statement, 0) /
                    (activeMonths.reduce((sum, month) => sum + month.receipts_received_before_statement, 0) +
                     activeMonths.reduce((sum, month) => sum + month.still_missing, 0))) * 100) : 0}%
                </p>
              </div>
            </div>
          </>
        )}

        {/* Charts */}
        {selectedPerson && activeMonths.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Monthly Charges vs Missing Receipts</h2>
              <Bar data={chartData} options={{ responsive: true }} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Receipt Status Overview</h2>
              <Doughnut data={pieData} options={{ responsive: true }} />
            </div>
          </div>
        )}

        {/* Data Table */}
        {selectedPerson && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Monthly Receipt Details - {selectedPerson.person_info.name}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Charges</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Additional</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeMonths.map((month, index) => (
                    <tr key={month.month} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {month.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === index ? (
                          <input
                            type="number"
                            value={editData?.charges || ''}
                            onChange={(e) => setEditData({...editData!, charges: parseInt(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        ) : (
                          month.charges
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === index ? (
                          <input
                            type="number"
                            value={editData?.receipts_received_before_statement || ''}
                            onChange={(e) => setEditData({...editData!, receipts_received_before_statement: parseInt(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        ) : (
                          month.receipts_received_before_statement
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === index ? (
                          <input
                            type="number"
                            value={editData?.receipts_requested || ''}
                            onChange={(e) => setEditData({...editData!, receipts_requested: parseInt(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        ) : (
                          month.receipts_requested
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === index ? (
                          <input
                            type="number"
                            value={editData?.additional_received || ''}
                            onChange={(e) => setEditData({...editData!, additional_received: parseInt(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        ) : (
                          month.additional_received
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === index ? (
                          <input
                            type="number"
                            value={editData?.still_missing || ''}
                            onChange={(e) => setEditData({...editData!, still_missing: parseInt(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            month.still_missing > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {month.still_missing}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {editingId === index ? (
                          <textarea
                            value={editData?.notes || ''}
                            onChange={(e) => setEditData({...editData!, notes: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-xs"
                            rows={2}
                          />
                        ) : (
                          <span title={month.notes}>
                            {month.notes || '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === index ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSave}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(index)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
