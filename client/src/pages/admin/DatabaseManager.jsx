import React from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Eye, RefreshCw, HardDrive, Clock, Shield } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

const collections = [
  { name: 'Users', records: 1240, size: '4.2 MB', lastUpdated: '2024-03-17 09:15', color: '#8b5cf6' },
  { name: 'Projects', records: 87, size: '1.8 MB', lastUpdated: '2024-03-17 08:42', color: '#10b981' },
  { name: 'Services', records: 12, size: '0.3 MB', lastUpdated: '2024-03-16 14:20', color: '#f59e0b' },
  { name: 'Contacts', records: 543, size: '2.1 MB', lastUpdated: '2024-03-17 07:30', color: '#ef4444' },
  { name: 'Jobs', records: 18, size: '0.4 MB', lastUpdated: '2024-03-15 11:00', color: '#6366f1' },
  { name: 'Categories', records: 24, size: '0.1 MB', lastUpdated: '2024-03-14 16:45', color: '#ec4899' },
  { name: 'Teams', records: 32, size: '0.8 MB', lastUpdated: '2024-03-13 09:00', color: '#06b6d4' },
  { name: 'Invoices', records: 156, size: '1.2 MB', lastUpdated: '2024-03-17 10:00', color: '#84cc16' },
];

const chartData = collections.map((c) => ({ name: c.name, records: c.records }));

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-lg p-3 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-violet-400 font-semibold">{payload[0].value.toLocaleString()} records</p>
      </div>
    );
  }
  return null;
};

export default function DatabaseManager() {
  const totalRecords = collections.reduce((s, c) => s + c.records, 0);
  const totalSize = '11.9 MB';

  const handleBackup = () => toast.success('Database backup initiated. You will be notified when complete.');
  const handleRestore = () => toast.info('Restore functionality requires confirmation. Please contact your DBA.');
  const handleExport = (name) => toast.success(`Exporting ${name} collection...`);
  const handleView = (name) => toast.info(`Opening ${name} collection viewer...`);
  const handleBackupCollection = (name) => toast.success(`Backing up ${name}...`);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-white">Database Manager</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor and manage database collections</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: totalRecords.toLocaleString(), icon: Database, color: 'text-violet-400', bg: 'from-violet-500/20 to-purple-500/20' },
          { label: 'Storage Used', value: totalSize, icon: HardDrive, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/20' },
          { label: 'Last Backup', value: 'Today 03:00 AM', icon: Shield, color: 'text-sky-400', bg: 'from-sky-500/20 to-blue-500/20' },
        ].map((s) => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.bg} border-white/10 backdrop-blur-sm`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs mb-1">{s.label}</p>
                <p className="text-white text-xl font-bold">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-white/5 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="flex gap-3 flex-wrap">
        <Button onClick={handleBackup} variant="glow" className="gap-2">
          <Shield className="w-4 h-4" /> Backup All
        </Button>
        <Button onClick={handleRestore} variant="outline" className="border-white/10 text-gray-400 hover:text-white gap-2">
          <RefreshCw className="w-4 h-4" /> Restore
        </Button>
      </motion.div>

      {/* Chart + Collections Table */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-1 bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-base">Collection Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                <defs>
                  <linearGradient id="dbGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <Bar dataKey="records" fill="url(#dbGrad)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white text-base">Collections</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Collection', 'Records', 'Size', 'Last Updated', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-gray-500 text-xs font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {collections.map((col, i) => (
                  <motion.tr
                    key={col.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: col.color + '25', border: `1px solid ${col.color}50` }}>
                          <Database className="w-3.5 h-3.5" style={{ color: col.color }} />
                        </div>
                        <span className="text-white text-sm font-medium">{col.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-sm font-semibold">{col.records.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm">{col.size}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-500 text-xs">{col.lastUpdated}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(col.name)}
                          className="h-7 w-7 text-gray-500 hover:text-violet-400" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleExport(col.name)}
                          className="h-7 w-7 text-gray-500 hover:text-emerald-400" title="Export">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleBackupCollection(col.name)}
                          className="h-7 w-7 text-gray-500 hover:text-sky-400" title="Backup">
                          <Shield className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
