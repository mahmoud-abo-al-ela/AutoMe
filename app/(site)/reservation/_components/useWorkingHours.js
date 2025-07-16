"use client";

import { useState, useEffect } from "react";

// Default working hours
const defaultWorkingHours = {
  MONDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  TUESDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  WEDNESDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  THURSDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  FRIDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  SATURDAY: { isOpen: true, openTime: "10:00", closeTime: "15:00" },
  SUNDAY: { isOpen: false, openTime: "", closeTime: "" },
};

export const useWorkingHours = () => {
  const [workingHours, setWorkingHours] = useState(defaultWorkingHours);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate available dates (next 14 days)
  const generateAvailableDates = (hours) => {
    const today = new Date();
    const dates = [];

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = {
        0: "SUNDAY",
        1: "MONDAY",
        2: "TUESDAY",
        3: "WEDNESDAY",
        4: "THURSDAY",
        5: "FRIDAY",
        6: "SATURDAY",
      }[date.getDay()];

      if (hours[dayOfWeek]?.isOpen) {
        dates.push(date);
      }
    }

    return dates;
  };

  // In a real application, you would fetch working hours from an API
  useEffect(() => {
    // Initialize with default dates immediately to prevent loading state issues
    const initialDates = generateAvailableDates(defaultWorkingHours);
    setAvailableDates(initialDates);

    // Simulate API call
    const fetchWorkingHours = async () => {
      try {
        // Here you would make an actual API call
        // const response = await fetch('/api/working-hours');
        // const data = await response.json();

        // For now, we'll use the default hours
        setWorkingHours(defaultWorkingHours);

        // Update available dates based on working hours
        setAvailableDates(initialDates);
      } catch (error) {
        console.error("Error fetching working hours:", error);
      } finally {
        setLoading(false);
      }
    };

    // Short timeout to ensure UI doesn't flash
    setTimeout(() => {
      fetchWorkingHours();
    }, 100);

    // Set loading to false after a maximum timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Function to check if a date should be disabled
  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return true;

    const dayOfWeek = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY",
    }[date.getDay()];

    return !workingHours[dayOfWeek]?.isOpen;
  };

  // Function to generate time slots based on opening and closing times
  const generateTimeSlots = (openTime, closeTime) => {
    const slots = [];
    const [openHour, openMinute] = openTime.split(":").map(Number);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);

    let currentHour = openHour;
    let currentMinute = openMinute;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      slots.push(
        `${currentHour.toString().padStart(2, "0")}:${currentMinute
          .toString()
          .padStart(2, "0")}`
      );

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    return slots;
  };

  return {
    workingHours,
    availableDates,
    loading,
    isDateDisabled,
    generateTimeSlots,
  };
};

export default useWorkingHours;
