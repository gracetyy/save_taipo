import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { StationFormData, stationFormSchema } from "./schemas/stationFormSchema";
import { CrowdStatus, StationType, SupplyStatus } from "../types";

export const useStationForm = () => {
  const {
    control,
    handleSubmit,
    formState,
    watch,
    setValue,
    reset
  } = useForm<StationFormData>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: {
      name: '',
      address: '',
      lat: 22.4468,
      lng: 114.1686,
      type: StationType.SUPPLY,
      status: SupplyStatus.AVAILABLE,
      crowdStatus: CrowdStatus.LOW,
      contact: '',
      contactLink: '',
      sourceUrl: '',
      remarks: '',
      offerings: [],
      needs: []
    }
  });

  return {
    control,
    handleSubmit,
    formState,
    watch,
    setValue,
    reset
  };
};