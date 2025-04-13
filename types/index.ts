export type Role = "admin" | "employee"

export interface User {
  id: string
  email: string
  name: string
  role: Role
  companies: CompanyAssociation[]
  createdAt: Date
}

export interface CompanyAssociation {
  companyId: string
  adminId: string
}

export interface Company {
  id: string
  name: string
  adminId: string
  color: string
  description?: string
  createdAt: Date
  users: string[] // User IDs
}

export interface RequiredDocument {
  id: string
  name: string
  description: string
  companyId: string
  deadline: {
    type: "monthly" | "biannual" | "custom"
    day?: number // For monthly: day of month
    months?: number[] // For biannual: which months
    date?: Date // For custom: specific date
  }
  allowedFileTypes: string[]
  createdAt: Date
}

export interface UploadedFile {
  id: string
  userId: string
  companyId: string
  documentId: string
  status: "pending" | "approved" | "rejected"
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  adminNotes?: string
  pdfUrl?: string
  downloaded: boolean
  downloadedAt?: Date
  archived: boolean
  archivedAt?: Date
  versions: FileVersion[]
}

export interface FileVersion {
  url: string
  uploadedAt: Date
  fileType: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: Date
  type: "approval" | "rejection" | "reminder" | "system"
  relatedDocumentId?: string
  relatedFileId?: string
}

export type UserRole = Role
