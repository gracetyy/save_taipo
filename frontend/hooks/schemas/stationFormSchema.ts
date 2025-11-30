import z from "zod";
import { CrowdStatus, StationType, SupplyStatus } from "../../types";

export const needItemSchema = z.object({
  item: z.string().min(1, "Item name is required"),
  status: z.enum(SupplyStatus),
  quantity: z.number().optional(),
});

export const stationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.enum(StationType),
  status: z.enum(SupplyStatus),
  crowdStatus: z.enum(CrowdStatus),
  contact: z.string().min(1, "Contact is required"),
  contactLink: z.string().url("Must be a valid URL").or(z.literal("")),
  sourceUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  remarks: z.string(),
  offerings: z.array(z.string()),
  needs: z.array(needItemSchema),
  showMapPicker: z.boolean(),
  isLocating: z.boolean(),
  showNeedsSelector: z.boolean(),
});

export type StationFormData = z.infer<typeof stationFormSchema>;
