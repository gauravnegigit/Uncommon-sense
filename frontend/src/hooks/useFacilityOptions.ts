import { useEffect, useState } from 'react';
import { facilityService } from '../services/facilityService';
import { Facility } from '../types';

/**
 * Fetches real facilities from the backend (GET /facilities) so components
 * can populate facility pickers with live IDs instead of hardcoded demo
 * slugs like 'phc-phaphamau', which never match a real database record.
 *
 * If the logged-in staff user has a `home_facility_id`, that facility is
 * used as the default selection when present in the fetched list.
 */
export const useFacilityOptions = (homeFacilityId?: string | null) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(homeFacilityId || '');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const list = await facilityService.listFacilities({ limit: 100 });
      if (cancelled) return;
      setFacilities(list);

      setSelectedFacilityId((prev) => {
        if (prev && list.some((f) => f.id === prev)) return prev;
        if (homeFacilityId && list.some((f) => f.id === homeFacilityId)) return homeFacilityId;
        return list[0]?.id || '';
      });
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeFacilityId]);

  return { facilities, isLoading, selectedFacilityId, setSelectedFacilityId };
};
