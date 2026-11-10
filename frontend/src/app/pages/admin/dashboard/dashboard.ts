import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartItem, DashboardSummary } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';
import { getErrorMessage } from '../../../core/utils/error-message';

const PIE_COLORS = ['#771013', '#9c5a1a', '#1f3b8f', '#2e7d32', '#e0b23c', '#adb5bd'];

interface LegendItem {
  name: string;
  percentage: number;
  color: string;
}

interface SectorBar {
  name: string;
  total: number;
  width: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private adminService = inject(AdminService);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  errorMessage = signal('');

  barData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  pieData = signal<ChartData<'pie'>>({ labels: [], datasets: [] });
  professionLegend = signal<LegendItem[]>([]);
  sectorBars = signal<SectorBar[]>([]);

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.adminService.getDashboard().subscribe({
      next: (result) => {
        this.summary.set(result);
        this.buildBarChart(result.applicationsByMonth);
        this.buildPieChart(result.applicantsByProfession);
        this.buildSectorBars(result.companiesBySector);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  buildBarChart(items: ChartItem[]): void {
    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];
    for (const item of items) {
      labels.push(item.name);
      values.push(item.total);
      colors.push('#771013');
    }
    if (colors.length > 0) {
      colors[colors.length - 1] = '#e0b23c';
    }
    this.barData.set({
      labels: labels,
      datasets: [{ data: values, backgroundColor: colors, label: 'Postulaciones' }],
    });
  }

  buildPieChart(items: ChartItem[]): void {
    let total = 0;
    for (const item of items) {
      total += item.total;
    }
    const labels: string[] = [];
    const values: number[] = [];
    const legend: LegendItem[] = [];
    for (let i = 0; i < items.length; i++) {
      labels.push(items[i].name);
      values.push(items[i].total);
      legend.push({
        name: items[i].name,
        percentage: Math.round((items[i].total / total) * 100),
        color: PIE_COLORS[i % PIE_COLORS.length],
      });
    }
    this.pieData.set({
      labels: labels,
      datasets: [{ data: values, backgroundColor: PIE_COLORS }],
    });
    this.professionLegend.set(legend);
  }

  buildSectorBars(items: ChartItem[]): void {
    let max = 0;
    for (const item of items) {
      if (item.total > max) {
        max = item.total;
      }
    }
    const bars: SectorBar[] = [];
    for (const item of items) {
      bars.push({
        name: item.name,
        total: item.total,
        width: Math.round((item.total / max) * 100),
      });
    }
    this.sectorBars.set(bars);
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('es-BO', {
      timeZone: 'America/La_Paz',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatRate(rate: number): string {
    return rate.toLocaleString('es-BO', { maximumFractionDigits: 1 });
  }

  daysSince(date: string): number {
    return Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
  }
}
