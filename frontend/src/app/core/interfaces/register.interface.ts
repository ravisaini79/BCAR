export interface RegistrationData {
  name: string;
  fatherHusbandName?: string;
  dob?: string;
  gender?: string;
  maritalStatus?: string;
  wifeHusbandName?: string;
  childrenSon?: number;
  childrenDaughter?: number;
  educationalQualification?: string;
  email: string;
  phone: string;
  password?: string;
  homeAddressVill: string;
  po?: string;
  ps?: string;
  district: string;
  pin?: string;
  gramPanchayat?: string;
  devBlock?: string;
  bcCspIdNo?: string;
  ssa?: string;
  bankName?: string;
  linkBranchName?: string;
  dateOfStartingCsp?: string;
  interestedToJoin: 'YES' | 'NO';
  admissionFee?: string | number;
  perMonthMembershipFee?: string | number;
  declarationAccepted: boolean;
  
  photograph?: string | null;
  aadhaarCard?: string | null;
  panCard?: string | null;
  bankBcCertificate?: string | null;
}

export interface RegisterResponse {
  success: boolean;
  registrationNumber: string;
  receiptNumber?: string;
  emailSent?: boolean;
  receiptGenerated?: boolean;
  message: string;
  status: string;
  photograph?: string;
  aadhaarCard?: string;
  panCard?: string;
  bankBcCertificate?: string;
}
