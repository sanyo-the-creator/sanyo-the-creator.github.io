import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface CampaignSettings {
  videoEnabled: boolean;
  redditEnabled: boolean;
  settingsLoading: boolean;
}

// Admin-controlled switches stored in the `campaign_settings` table.
// Defaults to everything enabled until the flags load (and if the
// table is missing/unreachable, nothing gets hidden by accident).
export const useCampaignSettings = (): CampaignSettings => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [redditEnabled, setRedditEnabled] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('campaign_settings')
      .select('key, enabled')
      .then(({ data }: any) => {
        (data || []).forEach((row: any) => {
          if (row.key === 'video_campaign') setVideoEnabled(!!row.enabled);
          if (row.key === 'reddit_campaign') setRedditEnabled(!!row.enabled);
        });
        setSettingsLoading(false);
      });
  }, []);

  return { videoEnabled, redditEnabled, settingsLoading };
};
