import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import DynamicPage from "../../pages/DynamicPage";
import ProfilePage from "../../pages/ProfilePage";
import WatchPage from "../../pages/WatchPage";
import AssessmentPage from '../../pages/AssessmentPage';
import DiscoverPage from "../../pages/DiscoverPage"
import ConnectionsPage from "../../pages/ConnectionsPage"


export const UserRouter = (
  <>
  
    <Route element={<ProtectedRoute allowedRoles={['ROLE_USER']} />}>
      <Route path="/dynamicpage" element={<DynamicPage />} />
      <Route path="/videos/:videoUuid" element={<WatchPage />} />
      <Route path="/discover" element={<DiscoverPage />} />
       <Route path="/connection" element={<ConnectionsPage />} />
      
    </Route>

    <Route
      element={
        <ProtectedRoute
          allowedRoles={['ROLE_USER', 'ROLE_COMMITTEE', 'ROLE_ADMIN']}
        />
      }
    >
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
    </Route>
  </>
);