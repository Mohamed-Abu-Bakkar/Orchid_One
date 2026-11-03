window.MockData = {
  employee: { name: 'Arun Kumar', shift: 'Morning', hours: '06:00 – 14:00' },
  teamByShift: [
    { shift: 'Morning', time: '06:00 – 14:00', color: '#34A853', members: [
      { initials: 'AK', name: 'Arun Kumar', you: true, oversees: 'Bulk procurement · Quality grading', tasks: 'Inspect incoming lot, Grade flowers, Update stock sheet', status: 'On shift' },
      { initials: 'RK', name: 'Ravi Kumar', oversees: 'Cold storage · Sorting', tasks: 'Sort roses, Log wastage, Handover to dispatch', status: 'On shift' },
      { initials: 'AP', name: 'Anita Patel', oversees: 'Packing · Dispatch', tasks: 'Pack bouquets, Update dispatch sheet, Seal crates', status: 'On shift' },
      { initials: 'SM', name: 'Suresh Menon', oversees: 'Cold room · Equipment', tasks: 'Service cooler, Log downtime, Safety check', status: 'On break' }
    ]},
    { shift: 'Evening', time: '15:00 – 23:00', color: '#F9AB00', members: [
      { initials: 'NP', name: 'Neha Patel', oversees: 'Finishing · District dispatch', tasks: 'Final QC, Label crates, Handover to night', status: 'Upcoming' },
      { initials: 'VK', name: 'Vikram Khanna', oversees: 'Warehouse · Inventory', tasks: 'Stock audit, Reorder alerts, Zone cleanup', status: 'Upcoming' }
    ]}
  ],
  feedback: { submitted: false, deadlineDays: 2 }
};
