"use client";

import { toast } from "sonner";

export const notifySuccess = (message: string, description?: string) => {
  toast.success(message, { description, duration: 3000 });
};

export const notifyError = (message: string, description?: string) => {
  toast.error(message, { description, duration: 4000 });
};

export const notifyWarning = (message: string, description?: string) => {
  toast.warning(message, { description, duration: 3500 });
};

export const notifyInfo = (message: string, description?: string) => {
  toast.info(message, { description, duration: 3000 });
};
