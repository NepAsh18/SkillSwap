import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import UploadPage from "../../pages/committee/UploadPage";
import ManageVideosPage from "../../pages/committee/ManageVideosPage";
import PlaylistManagePage from "../../pages/committee/PlaylistManagePage";
import { ROUTES } from "../../constants/routes";

export const CommitteeRouter = (
  <>
    <Route
      path="/committee/upload"
      element={<UploadPage />}
    />

    <Route
      path="/committee/manage"
      element={<ManageVideosPage />}
    />

    <Route
      path="/committee/playlists"
      element={<PlaylistManagePage />}
    />
  </>
);