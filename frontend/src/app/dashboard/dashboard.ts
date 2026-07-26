import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  profilePhoto?: any;
  photograph?: any;
  subDistrict?: string;
  aadhaarNumber?: string;
  bloodGroup?: string;
  bankAccountNumber?: string;
  accountNo?: string;
  ifsc?: string;
  wifeHusbandName?: string;
  childrenSon?: number | string;
  childrenDaughter?: number | string;
  interestedToJoin?: string;
  admissionFee?: string;
  perMonthMembershipFee?: string;
  receiptNumber?: string;
  registrationFee?: number;
  paymentStatus?: string;
  paymentMode?: string;
  transactionId?: string;
  createdBy?: string;
  emailVerified?: boolean;
  [key: string]: any;
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
  private cdr = inject(ChangeDetectorRef);

  // States
  user: User | null = null;
  sidebarCollapsed = false;
  activeView: 'overview' | 'members' | 'pending' | 'approved' | 'rejected' | 'notices' | 'grievances' | 'gallery' | 'news' = 'overview';
  loading = false;
  busy = false;

  hasDoc(u: any, ...fields: string[]): boolean {
    if (!u) return false;
    return fields.some(f => !!u[f]);
  }

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
  editingNoticeId = '';
  showGrievanceDialog = false;
  showViewDialog = false;
  selectedMember: User | null = null;
  showCardPreviewDialog = false;
  cardPreviewMember: User | null = null;

  // Edit Profile Dialog state
  showEditProfileDialog = false;
  editMemberData: any = {};
  editSubmitting = false;

  // Change Password Dialog state
  showChangePasswordDialog = false;
  passwordSubmitting = false;
  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

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

    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
    }

    setTimeout(() => {
      this.refreshAll();
    });
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
    if (!Array.isArray(this.members)) return [];
    const filter = (this.memberFilter || '').toLowerCase().trim();
    let list = this.members;

    // Filter by category state if not "all members"
    if (this.activeView === 'pending') {
      list = this.members.filter(m => m && (m.status === 'pending' || m.status === 'Pending Approval'));
    } else if (this.activeView === 'approved') {
      list = this.members.filter(m => m && (m.status === 'active' || m.status === 'Approved'));
    } else if (this.activeView === 'rejected') {
      list = this.members.filter(m => m && m.status === 'rejected');
    }

    if (!filter) return list;

    return list.filter(
      m => m && (
        (m.name && m.name.toLowerCase().includes(filter)) ||
        (m.phone && String(m.phone).includes(filter)) ||
        (m.email && m.email.toLowerCase().includes(filter)) ||
        (m.district && m.district.toLowerCase().includes(filter)) ||
        (m.registrationNumber && m.registrationNumber.toLowerCase().includes(filter)) ||
        (m.membershipNo && m.membershipNo.toLowerCase().includes(filter))
      )
    );
  }

  get filteredGrievances(): any[] {
    if (!Array.isArray(this.grievances)) return [];
    if (this.grievanceFilter === 'all') return this.grievances;
    return this.grievances.filter(g => g && g.status === this.grievanceFilter);
  }

  // Navigation
  navigate(view: typeof this.activeView) {
    this.activeView = view;
    this.selectedMembers = [];
    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
    }
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
        this.notices = Array.isArray(n) ? n : (n?.notices || n?.data || []);
        this.checkLoadingState();
      },
      error: () => this.checkLoadingState()
    });

    // Member view flow
    if (this.isMember) {
      this.dashboardService.getMyGrievances().subscribe({
        next: g => {
          const list = Array.isArray(g) ? g : (g?.grievances || g?.data || []);
          this.grievances = list;
          this.openGrievancesCount = list.filter((item: any) => item && item.status === 'open').length;
          this.checkLoadingState();
        },
        error: () => this.checkLoadingState()
      });
    } else {
      // Admin / coordinator flow
      this.dashboardService.getStats().subscribe({
        next: s => {
          if (s) {
            this.stats = s.data || s;
          }
          this.checkLoadingState();
        },
        error: () => this.checkLoadingState()
      });

      this.dashboardService.getMembers().subscribe({
        next: res => {
          const memberList = Array.isArray(res) ? res : (res?.members || res?.data?.members || []);
          this.members = memberList;
          this.recentMembers = memberList.slice(0, 5);
          this.pendingCount = memberList.filter((item: any) => item && (item.status === 'pending' || item.status === 'Pending Approval')).length;
          this.generateCharts();
          this.checkLoadingState();
        },
        error: () => this.checkLoadingState()
      });

      this.dashboardService.getAllGrievances().subscribe({
        next: res => {
          const list = Array.isArray(res) ? res : (res?.grievances || res?.data || []);
          this.grievances = list;
          this.openGrievancesCount = list.filter((item: any) => item && item.status === 'open').length;
          this.checkLoadingState();
        },
        error: () => this.checkLoadingState()
      });
    }
  }

  private checkLoadingState() {
    this.loading = false;
    this.cdr.markForCheck();
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
  async generateCard(m: User) {
    this.toastService.info(`Generating CSP card for ${m.name}...`);
    try {
      await this.cardService.generateCard(m);
      this.toastService.success(`Card downloaded for ${m.name}`);
    } catch (err) {
      console.error('Card generation failed:', err);
      this.toastService.error('Failed to generate card. Please try again.');
    }
  }

  async emailCard(m: User) {
    this.toastService.info(`Generating ID Card to email for ${m.name}...`);
    try {
      const base64 = await this.cardService.getCardBase64(m);
      this.toastService.info(`Sending card email to ${m.email}...`);
      this.dashboardService.sendCardEmail({
        email: m.email,
        name: m.name,
        membershipNo: m.membershipNo || 'N/A',
        cardImageBase64: base64
      }).subscribe({
        next: () => {
          this.toastService.success(`ID Card successfully emailed to ${m.email}!`);
        },
        error: (err) => {
          console.error('Email card failed:', err);
          this.toastService.error('Failed to send card email.');
        }
      });
    } catch (err) {
      console.error('Card rendering failed:', err);
      this.toastService.error('Failed to render card for emailing.');
    }
  }

  previewCard(m: User) {
    this.cardPreviewMember = m;
    this.showCardPreviewDialog = true;
  }

  async printCard(m: User) {
    this.toastService.info(`Preparing print view for ${m.name}...`);
    try {
      await this.cardService.printCard(m);
    } catch (err) {
      console.error('Print card failed:', err);
      this.toastService.error('Failed to open print view.');
    }
  }

  getFormattedAddress(m: any): string {
    if (!m) return '—';
    const parts = [m.homeAddressVill, m.gramPanchayat, m.devBlock].filter(Boolean);
    const addr = parts.join(', ') || 'Jagatpura, Jaipur';
    const districtPin = `${m.district || 'Rajasthan'} - ${m.pin || '302017'}`;
    return `${addr}\n${districtPin}`;
  }

  getValidUptoDate(dateVal: any): string {
    if (!dateVal) return '24-07-2028';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '24-07-2028';
    d.setFullYear(d.getFullYear() + 3);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  }

  getInitial(name: string | undefined): string {
    return name && name.trim() ? name.trim().charAt(0).toUpperCase() : 'U';
  }

  getMemberPhoto(m: any): string | undefined {
    if (!m) return undefined;
    let url = m.profilePhoto?.secure_url || m.photograph?.secure_url
           || m.profilePhoto?.url || m.photograph?.url
           || (typeof m.profilePhoto === 'string' && m.profilePhoto.trim() ? m.profilePhoto : null)
           || (typeof m.photograph === 'string' && m.photograph.trim() ? m.photograph : null)
           || (typeof m.profileImage === 'string' && m.profileImage.trim() ? m.profileImage : null)
           || m.profileImage?.secure_url || m.profileImage?.url;

    if (!url) return undefined;
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
  }

  onProfilePhotoSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.toastService.error('Image size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      this.cropperImageSrc = base64;
      this.showCropperDialog = true;
    };
    reader.readAsDataURL(file);
  }

  // Attachment & Document helpers
  isImageFile(url: string | undefined): boolean {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url) || url.startsWith('data:image/');
  }

  viewDocument(url: string | undefined) {
    if (!url) return;
    window.open(url, '_blank');
  }

  getAttachments(m: any): any[] {
    if (!m) return [];
    
    const docs = [
      { field: 'profilePhoto', label: 'Profile Photo', icon: 'pi-user' },
      { field: 'photograph', label: 'Photograph', icon: 'pi-image' },
      { field: 'aadhaarFront', label: 'Aadhaar Card (Front)', icon: 'pi-id-card' },
      { field: 'aadhaarBack', label: 'Aadhaar Card (Back)', icon: 'pi-id-card' },
      { field: 'panCard', label: 'PAN Card', icon: 'pi-id-card' },
      { field: 'bankBcCertificate', label: 'Bank BC Certificate', icon: 'pi-file-pdf' },
      { field: 'bankPassbook', label: 'Bank Passbook', icon: 'pi-book' },
      { field: 'signature', label: 'Signature', icon: 'pi-pencil' },
      { field: 'otherDocuments', label: 'Other Documents', icon: 'pi-folder-open' }
    ];

    return docs.map(d => {
      const fileData = m[d.field];
      const url = fileData?.secure_url || fileData?.url || (typeof fileData === 'string' && fileData.trim() ? fileData : null);
      const filename = fileData?.original_filename || (url ? url.split('/').pop() : '');
      return {
        label: d.label,
        icon: d.icon,
        exists: !!url,
        url: url || undefined,
        filename: filename || 'document'
      };
    });
  }

  // Image Cropper State & Helpers
  showCropperDialog = false;
  cropperImageSrc: string | null = null;
  cropperZoom = 1.0;
  cropperX = 0;
  cropperY = 0;
  isDragging = false;
  startX = 0;
  startY = 0;
  cropperDisplayW = 250;
  cropperDisplayH = 250;
  cropperNaturalW = 0;
  cropperNaturalH = 0;

  openCropperForCurrentPhoto() {
    if (!this.editMemberData) return;
    const url = this.getMemberPhoto(this.editMemberData);
    if (url) {
      this.cropperImageSrc = url;
      this.showCropperDialog = true;
    }
  }

  startPan(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDragging = true;
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    this.startX = clientX - this.cropperX;
    this.startY = clientY - this.cropperY;
  }

  panImage(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    this.cropperX = clientX - this.startX;
    this.cropperY = clientY - this.startY;
  }

  endPan() {
    this.isDragging = false;
  }

  getCropperTransform(): string {
    return `translate(-50%, -50%) translate(${this.cropperX}px, ${this.cropperY}px) scale(${this.cropperZoom})`;
  }

  onCropperImageLoaded(event: any) {
    const img = event.target;
    this.cropperNaturalW = img.naturalWidth;
    this.cropperNaturalH = img.naturalHeight;

    if (this.cropperNaturalW > this.cropperNaturalH) {
      this.cropperDisplayH = 250;
      this.cropperDisplayW = 250 * (this.cropperNaturalW / this.cropperNaturalH);
    } else {
      this.cropperDisplayW = 250;
      this.cropperDisplayH = 250 * (this.cropperNaturalH / this.cropperNaturalW);
    }

    this.cropperX = 0;
    this.cropperY = 0;
    this.cropperZoom = 1.0;
  }

  applyCroppedImage() {
    if (!this.cropperImageSrc) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 250;
      canvas.height = 250;
      const ctx = canvas.getContext('2d')!;

      // Clear with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 250, 250);

      // Apply zoom & translation relative to center
      ctx.translate(125 + this.cropperX, 125 + this.cropperY);
      ctx.scale(this.cropperZoom, this.cropperZoom);

      // Draw centered
      ctx.drawImage(img, -this.cropperDisplayW / 2, -this.cropperDisplayH / 2, this.cropperDisplayW, this.cropperDisplayH);

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);

      const photoObj = {
        secure_url: croppedBase64,
        url: croppedBase64,
        uploaded_at: new Date()
      };

      if (this.editMemberData) {
        this.editMemberData.profilePhoto = photoObj;
        this.editMemberData.photograph = photoObj;
      }

      this.showCropperDialog = false;
      this.toastService.success('Profile photo cropped successfully.');
    };
    img.src = this.cropperImageSrc;
  }

  // Dialog handling
  viewMember(m: User) {
    this.selectedMember = m;
    this.showViewDialog = true;
  }

  openEditProfile(m?: User) {
    const target = m || this.user;
    if (!target) return;
    this.editMemberData = JSON.parse(JSON.stringify(target));
    this.showEditProfileDialog = true;
  }

  saveMemberProfile() {
    if (!this.editMemberData || !this.editMemberData._id) return;
    this.editSubmitting = true;

    this.dashboardService.updateMemberProfile(this.editMemberData._id, this.editMemberData).subscribe({
      next: (res: any) => {
        this.editSubmitting = false;
        this.showEditProfileDialog = false;
        this.toastService.success('User profile updated successfully.');

        // If updated logged in user's profile, sync local user state & localStorage
        if (this.user && this.user._id === this.editMemberData._id) {
          this.user = { ...this.user, ...res.user };
          localStorage.setItem('bcar_user', JSON.stringify(this.user));
        }

        // If view dialog is open for this member, sync selectedMember
        if (this.selectedMember && this.selectedMember._id === this.editMemberData._id) {
          this.selectedMember = { ...this.selectedMember, ...res.user };
        }

        this.refreshAll();
      },
      error: (err: any) => {
        this.editSubmitting = false;
        console.error('Failed to update profile:', err);
        this.toastService.error(err.error?.message || 'Failed to update profile. Please try again.');
      }
    });
  }

  openChangePasswordDialog() {
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.showChangePasswordDialog = true;
  }

  submitPasswordChange() {
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.toastService.warn('Please fill in all password fields.');
      return;
    }
    if (this.passwordForm.newPassword.length < 6) {
      this.toastService.warn('New password must be at least 6 characters long.');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toastService.error('New password and confirm password do not match.');
      return;
    }

    this.passwordSubmitting = true;
    this.dashboardService.changePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: (res: any) => {
        this.passwordSubmitting = false;
        this.showChangePasswordDialog = false;
        this.showEditProfileDialog = false;
        this.toastService.success('Password changed successfully.');
      },
      error: (err: any) => {
        this.passwordSubmitting = false;
        this.toastService.error(err.error?.message || 'Failed to change password. Please try again.');
      }
    });
  }

  // Submit Notice Draft
  submitNotice() {
    if (!this.noticeDraft.title || !this.noticeDraft.body) {
      this.toastService.warn('Please fill in all required fields.');
      return;
    }
    this.busy = true;
    if (this.editingNoticeId) {
      // Edit mode
      this.dashboardService.updateNotice(this.editingNoticeId, this.noticeDraft).subscribe({
        next: () => {
          this.busy = false;
          this.showNoticeDialog = false;
          this.resetNoticeDraft();
          this.toastService.success('Notice updated successfully.');
          this.refreshAll();
        },
        error: () => {
          this.busy = false;
          this.toastService.error('Failed to update notice.');
        }
      });
    } else {
      // Create mode
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
  }

  editNotice(notice: any) {
    this.editingNoticeId = notice._id;
    this.noticeDraft = {
      title: notice.title,
      body: notice.body,
      category: notice.category || 'General'
    };
    this.showNoticeDialog = true;
  }

  deleteNotice(id: string) {
    if (confirm('Are you sure you want to delete this notice?')) {
      this.dashboardService.deleteNotice(id).subscribe({
        next: () => {
          this.toastService.success('Notice deleted successfully.');
          this.refreshAll();
        },
        error: () => this.toastService.error('Failed to delete notice.')
      });
    }
  }

  resetNoticeDraft() {
    this.noticeDraft = { title: '', body: '', category: 'General' };
    this.editingNoticeId = '';
  }

  onNoticeDialogVisibleChange(visible: boolean) {
    this.showNoticeDialog = visible;
    if (!visible) {
      this.resetNoticeDraft();
    }
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

  maskAadhaar(aadhaar: string | undefined): string {
    if (!aadhaar) return '—';
    const clean = aadhaar.toString().replace(/\D/g, '');
    if (clean.length >= 4) {
      const last4 = clean.slice(-4);
      return `XXXX XXXX ${last4}`;
    }
    return aadhaar;
  }
}
