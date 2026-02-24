export interface Experience {
  title: string;
  desc: string;
  date: string;
  time: string;
  loc: string;
  cents: number;
  payDesc: string;
  donMsg: string;
}

export interface Invitation {
  id: string;
  school: string;
  teacher: string;
  email: string;
  status: 'PENDING' | 'SENT' | 'ACTIVE' | 'COMPLETED';
}

export interface Student {
  id: string;
  inv: string;
  f: string;
  l: string;
  gr: string;
}

export interface Guardian {
  sid: string;
  name: string;
  phone: string;
  email: string;
  lang?: string;
}

export interface PermissionSlip {
  id: string;
  inv: string;
  sid: string;
  tok: string;
  status: 'PENDING' | 'SENT' | 'OPENED' | 'COMPLETED';
}

export interface Payment {
  slid: string;
  type: 'REQ' | 'DON';
  cents: number;
  ok: boolean;
}

export interface FormField {
  id: string;
  type: 'heading' | 'text' | 'date' | 'area' | 'drop' | 'chk' | 'doc';
  label: string;
  req?: boolean;
  pre?: string;
  ph?: string;
  opts?: string[];
}

export interface SchoolAddendum {
  name: string;
  text: string;
}

export type SlipStatus = 'PENDING' | 'SENT' | 'OPENED' | 'COMPLETED';
export type InvStatus = 'PENDING' | 'SENT' | 'ACTIVE' | 'COMPLETED';
export type PaymentOption = 'full' | 'partial' | 'cant';
