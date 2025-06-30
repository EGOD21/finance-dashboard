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

interface ReceiptData {
  'Unnamed: 0': string | number;
  '# of charges': string | number;
  'Number of receipts received  before statement': number | null;
  'Number of receipts requested': number | null;
  'Additional Received': number | null;
  'Still Missing': number | null;
  'Notes': string | null;
}

export default function Dashboard() {
  const [data, setData] = useState<ReceiptData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Error loading data:', err));
  }, []);

  // Filter out header rows and invalid data
  const validData = data.filter((row, index) => 
    index > 1 && 
    typeof row['# of charges'] === 'string' && 
    row['# of charges'] !== 'Name'
  );

  const chartData = {
    labels: validData.map(row => row['# of charges'] as string),
    datasets: [
      {
        label: 'Charges',
        data: validData.map(row => row['Unnamed: 0'] as number || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Still Missing',
        data: validData.map(row => row['Still Missing'] || 0),
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
          validData.reduce((sum, row) => sum + (row['Number of receipts received  before statement'] || 0), 0),
          validData.reduce((sum, row) => sum + (row['Still Missing'] || 0), 0),
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.5)', 'rgba(239, 68, 68, 0.5)'],
        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const handleEdit = (index: number) => {
    setEditingId(index);
    setEditData({ ...validData[index] });
  };

  const handleSave = () => {
    if (editingId !== null && editData) {
      const newData = [...data];
      const originalIndex = data.findIndex((_, i) => i === editingId + 2);
      newData[originalIndex] = editData;
      setData(newData);
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
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{validData.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Charges</h3>
            <p className="text-3xl font-bold text-green-600">
              {validData.reduce((sum, row) => sum + (row['Unnamed: 0'] as number || 0), 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Missing Receipts</h3>
            <p className="text-3xl font-bold text-red-600">
              {validData.reduce((sum, row) => sum + (row['Still Missing'] || 0), 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Completion Rate</h3>
            <p className="text-3xl font-bold text-purple-600">
              {validData.length > 0 ? 
                Math.round((validData.reduce((sum, row) => sum + (row['Number of receipts received  before statement'] || 0), 0) /
                (validData.reduce((sum, row) => sum + (row['Number of receipts received  before statement'] || 0), 0) +
                 validData.reduce((sum, row) => sum + (row['Still Missing'] || 0), 0))) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Charges vs Missing Receipts</h2>
            <Bar data={chartData} options={{ responsive: true }} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Receipt Status Overview</h2>
            <Doughnut data={pieData} options={{ responsive: true }} />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Receipt Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
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
                {validData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row['# of charges']}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === index ? (
                        <input
                          type="number"
                          value={editData?.['Unnamed: 0'] || ''}
                          onChange={(e) => setEditData({...editData!, 'Unnamed: 0': parseInt(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border rounded"
                        />
                      ) : (
                        row['Unnamed: 0']
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === index ? (
                        <input
                          type="number"
                          value={editData?.['Number of receipts received  before statement'] || ''}
                          onChange={(e) => setEditData({...editData!, 'Number of receipts received  before statement': parseInt(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border rounded"
                        />
                      ) : (
                        row['Number of receipts received  before statement'] || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === index ? (
                        <input
                          type="number"
                          value={editData?.['Number of receipts requested'] || ''}
                          onChange={(e) => setEditData({...editData!, 'Number of receipts requested': parseInt(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border rounded"
                        />
                      ) : (
                        row['Number of receipts requested'] || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === index ? (
                        <input
                          type="number"
                          value={editData?.['Additional Received'] || ''}
                          onChange={(e) => setEditData({...editData!, 'Additional Received': parseInt(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border rounded"
                        />
                      ) : (
                        row['Additional Received'] || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === index ? (
                        <input
                          type="number"
                          value={editData?.['Still Missing'] || ''}
                          onChange={(e) => setEditData({...editData!, 'Still Missing': parseInt(e.target.value) || 0})}
                          className="w-20 px-2 py-1 border rounded"
                        />
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          (row['Still Missing'] || 0) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {row['Still Missing'] || 0}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {editingId === index ? (
                        <textarea
                          value={editData?.['Notes'] || ''}
                          onChange={(e) => setEditData({...editData!, 'Notes': e.target.value})}
                          className="w-full px-2 py-1 border rounded text-xs"
                          rows={2}
                        />
                      ) : (
                        <span title={row['Notes'] || ''}>
                          {row['Notes'] || '-'}
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
      </div>
    </div>
  );
}
