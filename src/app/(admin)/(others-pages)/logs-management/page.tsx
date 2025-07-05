import React, { Suspense } from "react";
import UserActivityLogsPage from "../../../../components/logs-manage/page";

export default function LogsWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading logs...</div>}>
      <UserActivityLogsPage />
    </Suspense>
  );
}
