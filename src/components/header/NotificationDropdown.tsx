"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Notification {
  id: number;
  userId: number;
  relatedUserId: number;
  jobApplicationId: number | null;
  courseApplicationId: number | null;
  message: string;
  type: 'course_application' | 'application_received' | string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  message: string;
  data: Notification[];
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    if (!token) return;

    try {
      const response = await axios.get<NotificationResponse>(
        `https://24a9m2v3ki.execute-api.eu-north-1.amazonaws.com/prod/notifications/user/1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Notifications fetched:", response.data.data);
      setNotifications(response.data.data || []);
      setNotifying(response.data.data.length > 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
    fetchNotifications();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setShowAll(false); // Reset showAll on open
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setShowAll(false); // Reset showAll on close
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 4);

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {notifying && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notification
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {displayedNotifications.map((item) => (
            <li key={item.id}>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              >
                <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                  <Image
                    width={40}
                    height={40}
                    src={`/images/user/user-${Math.floor(Math.random() * (30 - 11 + 1)) + 11}.jpg`}
                    alt="User"
                    className="w-full overflow-hidden rounded-full"
                  />
                </span>
                <span className="block">
                  <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {item.message}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                    <span>{item.type}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>Just now</span>
                  </span>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>

        {notifications.length > 4 && !showAll && (
          <button
             className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            onClick={() => setShowAll(true)}
          >
            Show All Notifications
          </button>
        )}

     
      </Dropdown>
    </div>
  );
}
