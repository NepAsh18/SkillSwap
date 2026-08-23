import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import DynamicPage from "../../pages/DynamicPage";
import ProfilePage from "../../pages/ProfilePage";
import WatchPage from "../../pages/WatchPage";
import AssessmentPage from '../../pages/AssessmentPage';
import DiscoverPage from "../../pages/DiscoverPage"
import ConnectionsPage from "../../pages/ConnectionsPage"
import ChatPage from  "../../pages/ChatPage"


export const UserRouter = (
  <>
   <Route path="/dynamicpage" element={<DynamicPage />} />
   <Route path="/videos/:videoUuid" element={<WatchPage />} />
  
    <Route element={<ProtectedRoute allowedRoles={['ROLE_USER']} />}>
      
      
      <Route path="/discover" element={<DiscoverPage />} />
       <Route path="/connections" element={<ConnectionsPage />} />
        <Route path="/chats/:chatId" element={<ChatPage />} />
      
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