import React from 'react';
import { SchoolConfig } from '../../types';

interface TopBarProps {
  config: SchoolConfig;
}

export const TopBar: React.FC<TopBarProps> = () => {
  // Legacy TopBar is deprecated. Important notices are placed below the Navbar using ImportantNoticeBanner.
  return null;
};


