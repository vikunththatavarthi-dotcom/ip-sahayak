import { useCallback, useEffect, useState } from "react";
import { createProfile, getProfile, updateProfile } from "./api";

const STORAGE_KEY = "ip_sakti_profile_id";

export function useProfile() {
  const [profileId, setProfileId] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (id) => {
    const targetId = id || profileId;
    if (!targetId) return;
    setLoading(true);
    try {
      const p = await getProfile(targetId);
      setProfile(p);
    } catch (e) {
      console.warn("Profile not found, clearing", e);
      localStorage.removeItem(STORAGE_KEY);
      setProfileId(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) refresh(profileId);
  }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProfile = useCallback(async (data) => {
    setLoading(true);
    try {
      let p;
      if (profileId) {
        p = await updateProfile(profileId, data);
      } else {
        p = await createProfile(data);
        localStorage.setItem(STORAGE_KEY, p.id);
        setProfileId(p.id);
      }
      setProfile(p);
      return p;
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  return { profileId, profile, loading, saveProfile, refresh };
}

export const ENTITY_TYPES = ["Individual", "Startup", "MSME", "University", "Manufacturer"];
export const AYUSH_CATEGORIES = ["Ayurveda", "Siddha", "Unani", "Homeopathy", "Yoga", "Multi-herb", "None"];
export const STAGES = ["Ideation", "Formulation", "Clinical Trial", "Ready to Launch", "Commercialized"];
