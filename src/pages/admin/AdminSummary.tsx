import React, { useMemo, useState } from 'react';
import { formatCurrency, type Order } from '../../lib/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  parseISO,
  format,
  eachDayOfInterval,
  isSameDay,
  eachMonthOfInterval,
  startOfYear,
  endOfYear
} from 'date-fns';

type AdminSummaryProps = {
  orders: Order[];
};

export const AdminSummary: React.FC<AdminSummaryProps> = ({ orders }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear'>('thisMonth');

  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (selectedTimeframe) {
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'lastMonth':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'last3Months':
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      case 'thisYear':
      default:
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
    }

    // Filter orders for the selected period
    const periodOrders = orders.filter((o) => {
      try {
        const orderDate = parseISO(o.createdAt);
        return isWithinInterval(orderDate, { start: startDate, end: endDate });
      } catch {
        return false;
      }
    });

    // Calculate Totals for the period
    let totalSales = 0;
    let pendingCount = 0;
    let deliveredCount = 0;
    let approvedCount = 0;
    let cancelledCount = 0;

    periodOrders.forEach((o) => {
      if (o.status !== 'CANCELLED') {
         totalSales += o.totalAmount;
      }
      if (o.status === 'PENDING') pendingCount++;
      if (o.status === 'DELIVERED') deliveredCount++;
      if (o.status === 'APPROVED') approvedCount++;
      if (o.status === 'CANCELLED') cancelledCount++;
    });

    // Generate Chart Data based on timeframe
    const chartData = (selectedTimeframe === 'thisMonth' || selectedTimeframe === 'lastMonth')
      ? eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
         const dayOrders = periodOrders.filter(o => {
            try { return isSameDay(parseISO(o.createdAt), day) && o.status !== 'CANCELLED'; }
            catch { return false; }
         });
         const daySales = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
         return { name: format(day, 'd MMM'), sales: daySales };
        })
      : eachMonthOfInterval({ start: startDate, end: endDate }).map(month => {
          const monthOrders = periodOrders.filter(o => {
             try {
               const d = parseISO(o.createdAt);
               return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() && o.status !== 'CANCELLED';
             } catch { return false; }
          });
          const monthSales = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
          return { name: format(month, 'MMM yyyy'), sales: monthSales };
        });

    return {
      totalSales,
      pendingCount,
      deliveredCount,
      approvedCount,
      cancelledCount,
      totalOrders: periodOrders.length,
      chartData
    };
  }, [orders, selectedTimeframe]);

  return (
    <div className="admin-summary-tab">
      <div className="summary-header">
         <div className="summary-title-wrapper">
             <div className="gold-icon-large">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
             </div>
             <div>
                <h3>Business Overview</h3>
                <p className="admin-muted">Track your sales performance and order status</p>
             </div>
         </div>
         <select
            className="admin-select summary-time-select"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear')}
         >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="last3Months">Last 3 Months</option>
            <option value="thisYear">This Year</option>
         </select>
      </div>

      <div className="summary-kpi-grid">
         <div className="kpi-card glass-card">
            <div className="kpi-icon gold-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div className="kpi-content">
                <div className="kpi-label">Total Sales</div>
                <div className="kpi-value highlight">{formatCurrency(stats.totalSales)}</div>
            </div>
         </div>
         <div className="kpi-card glass-card">
            <div className="kpi-icon text-warning">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div className="kpi-content">
                <div className="kpi-label">Pending Orders</div>
                <div className="kpi-value text-warning">{stats.pendingCount}</div>
            </div>
         </div>
         <div className="kpi-card glass-card">
            <div className="kpi-icon text-success">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div className="kpi-content">
                <div className="kpi-label">Approved</div>
                <div className="kpi-value text-success">{stats.approvedCount}</div>
            </div>
         </div>
         <div className="kpi-card glass-card">
            <div className="kpi-icon text-info">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
            <div className="kpi-content">
                <div className="kpi-label">Delivered</div>
                <div className="kpi-value text-info">{stats.deliveredCount}</div>
            </div>
         </div>
         <div className="kpi-card glass-card">
            <div className="kpi-icon text-muted">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div className="kpi-content">
                <div className="kpi-label">Total Orders</div>
                <div className="kpi-value">{stats.totalOrders}</div>
            </div>
         </div>
      </div>

      <div className="summary-chart-container glass-card">
         <h4 className="chart-title">Sales Trend ({selectedTimeframe === 'thisYear' || selectedTimeframe === 'last3Months' ? 'Monthly' : 'Daily'})</h4>
         <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer>
              <AreaChart data={stats.chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{fill: 'var(--color-text-muted)', fontSize: 12}} tickMargin={10} />
                <YAxis stroke="var(--color-text-muted)" tick={{fill: 'var(--color-text-muted)', fontSize: 12}} tickFormatter={(value) => `৳${value}`} tickMargin={10} />
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <Tooltip
                   contentStyle={{ backgroundColor: 'rgba(20,3,5,0.9)', backdropFilter: 'blur(10px)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                   itemStyle={{ color: 'var(--color-accent)', fontWeight: 'bold' }}
                   formatter={(value: any) => [formatCurrency(Number(value ?? 0)), 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--color-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};
