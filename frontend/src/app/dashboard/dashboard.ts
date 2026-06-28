import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// PrimeNG imports
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Avatar } from 'primeng/avatar';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { Dialog } from 'primeng/dialog';
import { Divider } from 'primeng/divider';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';

// Services
import { DashboardService } from './services/dashboard.service';
import { ToastService } from './services/toast.service';
import { MemberCardService } from './services/member-card.service';
import { GalleryManagementComponent } from './components/gallery-management/gallery-management';
import { NewsManagementComponent } from './components/news-management/news-management';

type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'coordinator' | 'member';
  status: 'pending' | 'active' | 'rejected' | 'Pending Approval' | 'Approved' | 'suspended';
  district: string;
  joinedAt: string;
  createdAt?: string;
  membershipNo?: string;
  registrationNumber?: string;
  fatherHusbandName?: string;
  dob?: string;
  gender?: string;
  maritalStatus?: string;
  educationalQualification?: string;
  homeAddressVill?: string;
  po?: string;
  ps?: string;
  pin?: string;
  gramPanchayat?: string;
  devBlock?: string;
  bcCspIdNo?: string;
  ssa?: string;
  bankName?: string;
  linkBranchName?: string;
  dateOfStartingCsp?: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    TitleCasePipe,
    Toast,
    ConfirmDialog,
    Avatar,
    Tag,
    TableModule,
    ChartModule,
    Dialog,
    Divider,
    Select,
    InputText,
    Textarea,
    TooltipModule,
    GalleryManagementComponent,
    NewsManagementComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  // Inject dependencies
  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private toastService = inject(ToastService);
  private cardService = inject(MemberCardService);
  private confirmationService = inject(ConfirmationService);

  // States
  user: User | null = null;
  sidebarCollapsed = false;
  activeView: 'overview' | 'members' | 'pending' | 'approved' | 'rejected' | 'notices' | 'grievances' | 'gallery' | 'news' = 'overview';
  loading = false;
  busy = false;

  // Overview Counts & Info
  pendingCount = 0;
  openGrievancesCount = 0;
  currentYear = new Date().getFullYear();

  stats = {
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    rejectedMembers: 0,
    todayRegistrations: 0,
    monthlyRegistrations: 0
  };

  // Main data lists
  members: User[] = [];
  recentMembers: User[] = [];
  notices: any[] = [];
  grievances: any[] = [];

  // Filter/Selection
  memberFilter = '';
  selectedMembers: User[] = [];
  grievanceFilter = 'all';

  // Compose drafts
  noticeDraft = { title: '', body: '', category: 'General' };
  grievanceDraft = { subject: '', description: '', category: 'Bank Issue' };

  // Dialog visibilities
  showNoticeDialog = false;
  showGrievanceDialog = false;
  showViewDialog = false;
  selectedMember: User | null = null;

  // Options lists
  categoryOptions = [
    { label: 'General Announcement', value: 'General' },
    { label: 'Meeting Notice', value: 'Meeting' },
    { label: 'Policy Update', value: 'Policy' }
  ];

  grievanceCategoryOptions = [
    { label: 'Bank Issue', value: 'Bank Issue' },
    { label: 'Commission Issues', value: 'Commission' },
    { label: 'Harassment & Disputes', value: 'Harassment' },
    { label: 'Other Support', value: 'Other' }
  ];

  grievanceStatuses = [
    { label: 'All', value: 'all' },
    { label: 'Open / Pending', value: 'open' },
    { label: 'In Review', value: 'in-review' },
    { label: 'Resolved', value: 'resolved' }
  ];

  grievanceStatusOptions = [
    { label: 'Open', value: 'open' },
    { label: 'In Review', value: 'in-review' },
    { label: 'Resolved', value: 'resolved' }
  ];

  // Chart data definitions
  registrationChartData: any;
  statusChartData: any;
  districtChartData: any;
  genderChartData: any;

  // Chart styles/options
  barChartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { boxPadding: 6 }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' } },
      x: { grid: { display: false }, ticks: { color: '#64748b' } }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  doughnutOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true, color: '#64748b' } }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  ngOnInit() {
    // Validate session
    const userStr = localStorage.getItem('bcar_user');
    const token = localStorage.getItem('bcar_token');

    if (!token || !userStr || userStr === 'undefined' || userStr === 'null') {
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.user = JSON.parse(userStr);
    } catch {
      localStorage.removeItem('bcar_user');
      localStorage.removeItem('bcar_token');
      this.router.navigate(['/login']);
      return;
    }

    this.refreshAll();
  }

  // Getters
  get userInitial(): string {
    return this.user?.name ? this.user.name.charAt(0).toUpperCase() : 'U';
  }

  get isAdmin(): boolean {
    return this.user ? this.user.role !== 'member' : false;
  }

  get isMember(): boolean {
    return this.user ? this.user.role === 'member' : false;
  }

  get viewTitle(): string {
    switch (this.activeView) {
      case 'overview':
        return 'System Overview';
      case 'members':
        return 'All Association Members';
      case 'pending':
        return 'Pending Verification';
      case 'approved':
        return 'Approved & Active Members';
      case 'rejected':
        return 'Rejected Registration Requests';
      case 'notices':
        return 'Notice Board';
      case 'grievances':
        return 'Grievance Desk';
      default:
        return 'Dashboard';
    }
  }

  get displayedMembers(): User[] {
    const filter = this.memberFilter.toLowerCase().trim();
    let list = this.members;

    // Filter by category state if not "all members"
    if (this.activeView === 'pending') {
      list = this.members.filter(m => m.status === 'pending' || m.status === 'Pending Approval');
    } else if (this.activeView === 'approved') {
      list = this.members.filter(m => m.status === 'active' || m.status === 'Approved');
    } else if (this.activeView === 'rejected') {
      list = this.members.filter(m => m.status === 'rejected');
    }

    if (!filter) return list;

    return list.filter(
      m =>
        (m.name && m.name.toLowerCase().includes(filter)) ||
        (m.phone && m.phone.includes(filter)) ||
        (m.email && m.email.toLowerCase().includes(filter)) ||
        (m.district && m.district.toLowerCase().includes(filter)) ||
        (m.registrationNumber && m.registrationNumber.toLowerCase().includes(filter)) ||
        (m.membershipNo && m.membershipNo.toLowerCase().includes(filter))
    );
  }

  get filteredGrievances(): any[] {
    if (this.grievanceFilter === 'all') return this.grievances;
    return this.grievances.filter(g => g.status === this.grievanceFilter);
  }

  // Navigation
  navigate(view: typeof this.activeView) {
    this.activeView = view;
    this.selectedMembers = [];
  }

  logout() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to log out of the admin panel?',
      header: 'Confirm Logout',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        localStorage.removeItem('bcar_token');
        localStorage.removeItem('bcar_user');
        this.toastService.success('Logged out successfully.');
        this.router.navigate(['/']);
      }
    });
  }

  // Refresh data flows
  refreshAll() {
    if (!this.user) return;
    this.loading = true;

    // Always fetch notices
    this.dashboardService.getNotices().subscribe({
      next: n => {
        this.notices = n;
        this.checkLoadingState();
      },
      error: () => this.checkLoadingState()
    });

    // Member view flow
    if (this.isMember) {
      this.dashboardService.getMyGrievances().subscribe({
        next: g => {
          this.grievances = g;
          this.openGrievancesCount = g.filter(item => item.status === 'open').length;
          this.checkLoadingState();
        },
        error: () => this.checkLoadingState()
      });
    } else {
      // Admin / coordinator flow
      this.dashboardService.getStats().subscribe({
        next: s => {
          this.stats = s;
          this.checkLoadingState();
        },
        error: () => this.checkLoadingState()
      });

      this.dashboardService.getMembers().subscribe({
        next: m => {
          this.members = m;
          this.recentMembers = m.slice(0, 5);
          this.pendingCount = m.filter(item => item.status === 'pending' || item.status === 'Pending Approval').length;
          this.generateCharts();
          this.checkLoadingState();
        },
        error: () => this.checkLoadingState()
      });

      this.dashboardService.getAllGrievances().subscribe({
        next: g => {
          this.grievances = g;
          this.openGrievancesCount = g.filter(item => item.status === 'open').length;
          this.checkLoadingState();
        },
        error: () => this.checkLoadingState()
      });
    }
  }

  private checkLoadingState() {
    // Basic debounce check for loading finish
    setTimeout(() => {
      this.loading = false;
    }, 100);
  }

  // Status mapping helpers
  formatStatus(status: string): string {
    if (!status) return 'Pending';
    if (status === 'active' || status === 'Approved') return 'Approved';
    if (status === 'pending' || status === 'Pending Approval') return 'Pending Approval';
    if (status === 'rejected') return 'Rejected';
    return status;
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | undefined {
    if (!status) return 'warn';
    const s = status.toLowerCase();
    if (s === 'active' || s === 'approved') return 'success';
    if (s === 'pending' || s === 'pending approval') return 'warn';
    if (s === 'rejected' || s === 'suspended') return 'danger';
    return 'info';
  }

  formatGrievanceStatus(status: string): string {
    if (status === 'open') return 'Open';
    if (status === 'in-review') return 'In Review';
    if (status === 'resolved') return 'Resolved';
    return status || 'Open';
  }

  getGrievanceSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | undefined {
    if (status === 'resolved') return 'success';
    if (status === 'in-review') return 'info';
    return 'danger';
  }

  grievanceCountByStatus(status: string): number {
    if (status === 'all') return this.grievances.length;
    return this.grievances.filter(g => g.status === status).length;
  }

  // Actions: Approval flow
  confirmApprove(m: User) {
    this.confirmationService.confirm({
      message: `Are you sure you want to approve member ${m.name}? This will generate their membership number and mail them secure credentials.`,
      header: 'Approve Registration',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.dashboardService.updateMemberStatus(m._id, 'active').subscribe({
          next: () => {
            this.toastService.success(`Approved ${m.name} successfully. Email sent.`);
            this.refreshAll();
          },
          error: () => this.toastService.error('Failed to approve member.')
        });
      }
    });
  }

  confirmReject(m: User) {
    this.confirmationService.confirm({
      message: `Are you sure you want to reject member ${m.name}'s registration?`,
      header: 'Reject Registration',
      icon: 'pi pi-ban',
      accept: () => {
        this.dashboardService.updateMemberStatus(m._id, 'rejected').subscribe({
          next: () => {
            this.toastService.success(`Rejected registration for ${m.name}.`);
            this.refreshAll();
          },
          error: () => this.toastService.error('Failed to reject registration.')
        });
      }
    });
  }

  confirmDelete(m: User) {
    this.confirmationService.confirm({
      message: `WARNING: Are you absolutely sure you want to permanently delete member ${m.name}? This action is irreversible.`,
      header: 'Delete Member',
      icon: 'pi pi-trash',
      accept: () => {
        this.dashboardService.deleteMember(m._id).subscribe({
          next: () => {
            this.toastService.success(`Deleted member ${m.name} from records.`);
            this.refreshAll();
          },
          error: () => this.toastService.error('Failed to delete member.')
        });
      }
    });
  }

  bulkApprove() {
    if (this.selectedMembers.length === 0) return;
    this.confirmationService.confirm({
      message: `Are you sure you want to bulk approve all ${this.selectedMembers.length} selected members?`,
      header: 'Bulk Approve',
      icon: 'pi pi-check',
      accept: () => {
        this.busy = true;
        let countCompleted = 0;
        const total = this.selectedMembers.length;

        this.selectedMembers.forEach(m => {
          this.dashboardService.updateMemberStatus(m._id, 'active').subscribe({
            next: () => {
              countCompleted++;
              if (countCompleted === total) {
                this.toastService.success(`Successfully approved ${total} members.`);
                this.busy = false;
                this.selectedMembers = [];
                this.refreshAll();
              }
            },
            error: () => {
              countCompleted++;
              if (countCompleted === total) {
                this.toastService.success(`Completed with some errors.`);
                this.busy = false;
                this.selectedMembers = [];
                this.refreshAll();
              }
            }
          });
        });
      }
    });
  }

  bulkReject() {
    if (this.selectedMembers.length === 0) return;
    this.confirmationService.confirm({
      message: `Are you sure you want to reject the registration of all ${this.selectedMembers.length} selected members?`,
      header: 'Bulk Reject',
      icon: 'pi pi-times',
      accept: () => {
        this.busy = true;
        let countCompleted = 0;
        const total = this.selectedMembers.length;

        this.selectedMembers.forEach(m => {
          this.dashboardService.updateMemberStatus(m._id, 'rejected').subscribe({
            next: () => {
              countCompleted++;
              if (countCompleted === total) {
                this.toastService.success(`Successfully rejected ${total} members.`);
                this.busy = false;
                this.selectedMembers = [];
                this.refreshAll();
              }
            },
            error: () => {
              countCompleted++;
              if (countCompleted === total) {
                this.toastService.success(`Completed with some errors.`);
                this.busy = false;
                this.selectedMembers = [];
                this.refreshAll();
              }
            }
          });
        });
      }
    });
  }

  // Card Generator helper
  generateCard(m: User) {
    this.cardService.generateCard(m);
    this.toastService.info(`Downloading membership card for ${m.name}...`);
  }

  // Dialog handling
  viewMember(m: User) {
    this.selectedMember = m;
    this.showViewDialog = true;
  }

  // Submit Notice Draft
  submitNotice() {
    if (!this.noticeDraft.title || !this.noticeDraft.body) {
      this.toastService.warn('Please fill in all required fields.');
      return;
    }
    this.busy = true;
    this.dashboardService.createNotice(this.noticeDraft).subscribe({
      next: () => {
        this.busy = false;
        this.showNoticeDialog = false;
        this.resetNoticeDraft();
        this.toastService.success('Notice published successfully.');
        this.refreshAll();
      },
      error: () => {
        this.busy = false;
        this.toastService.error('Failed to publish notice.');
      }
    });
  }

  resetNoticeDraft() {
    this.noticeDraft = { title: '', body: '', category: 'General' };
  }

  // Submit Grievance Draft
  submitGrievance() {
    if (!this.grievanceDraft.subject || !this.grievanceDraft.description) {
      this.toastService.warn('Please fill in all required fields.');
      return;
    }
    this.busy = true;
    this.dashboardService.createGrievance(this.grievanceDraft).subscribe({
      next: () => {
        this.busy = false;
        this.showGrievanceDialog = false;
        this.resetGrievanceDraft();
        this.toastService.success('Grievance filed successfully.');
        this.refreshAll();
      },
      error: () => {
        this.busy = false;
        this.toastService.error('Failed to submit grievance.');
      }
    });
  }

  resetGrievanceDraft() {
    this.grievanceDraft = { subject: '', description: '', category: 'Bank Issue' };
  }

  onGrievanceStatusChange(g: any, newStatus: string) {
    this.dashboardService.updateGrievanceStatus(g._id, newStatus).subscribe({
      next: () => {
        this.toastService.success(`Grievance status updated to ${newStatus}.`);
        this.refreshAll();
      },
      error: () => this.toastService.error('Failed to update grievance status.')
    });
  }

  // CSV Export utility
  exportCSV() {
    if (this.displayedMembers.length === 0) {
      this.toastService.warn('No members to export.');
      return;
    }

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Role',
      'Status',
      'Registration No',
      'Membership No',
      'District',
      'Bank',
      'Joined Date'
    ];

    const rows = this.displayedMembers.map(m => [
      `"${m.name || ''}"`,
      `"${m.email || ''}"`,
      `"${m.phone || ''}"`,
      `"${m.role || ''}"`,
      `"${m.status || ''}"`,
      `"${m.registrationNumber || ''}"`,
      `"${m.membershipNo || ''}"`,
      `"${m.district || ''}"`,
      `"${m.bankName || ''}"`,
      `"${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BCAR-Members-Export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ── CHARTS GENERATOR ───────────────────────────────────────────────
  private generateCharts() {
    if (this.members.length === 0) return;

    // 1. Monthly Registrations
    const monthlyCounts = new Array(12).fill(0);
    this.members.forEach(m => {
      if (m.createdAt) {
        const d = new Date(m.createdAt);
        if (d.getFullYear() === this.currentYear) {
          monthlyCounts[d.getMonth()]++;
        }
      }
    });

    this.registrationChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Registrations',
          backgroundColor: '#0B2D5C',
          borderColor: '#0B2D5C',
          data: monthlyCounts,
          borderRadius: 6
        }
      ]
    };

    // 2. Status Chart
    let approved = 0,
      pending = 0,
      rejected = 0;
    this.members.forEach(m => {
      const s = m.status ? m.status.toLowerCase() : '';
      if (s === 'active' || s === 'approved') approved++;
      else if (s === 'pending' || s === 'pending approval') pending++;
      else if (s === 'rejected') rejected++;
    });

    this.statusChartData = {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [
        {
          data: [approved, pending, rejected],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          hoverBackgroundColor: ['#059669', '#d97706', '#dc2626']
        }
      ]
    };

    // 3. District Chart (Top 10)
    const districtMap: { [key: string]: number } = {};
    this.members.forEach(m => {
      const d = m.district ? m.district.trim() : 'Unspecified';
      districtMap[d] = (districtMap[d] || 0) + 1;
    });

    const sortedDistricts = Object.keys(districtMap)
      .map(k => ({ name: k, count: districtMap[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.districtChartData = {
      labels: sortedDistricts.map(x => x.name),
      datasets: [
        {
          label: 'Members',
          backgroundColor: '#D4AF37',
          borderColor: '#D4AF37',
          data: sortedDistricts.map(x => x.count),
          borderRadius: 6
        }
      ]
    };

    // 4. Gender Chart
    let male = 0,
      female = 0,
      other = 0;
    this.members.forEach(m => {
      const g = m.gender ? m.gender.toLowerCase().trim() : '';
      if (g === 'male' || g === 'm') male++;
      else if (g === 'female' || g === 'f') female++;
      else other++;
    });

    this.genderChartData = {
      labels: ['Male', 'Female', 'Other / Unspecified'],
      datasets: [
        {
          data: [male, female, other],
          backgroundColor: ['#3b82f6', '#ec4899', '#64748b']
        }
      ]
    };
  }
}
