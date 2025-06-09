<script lang="ts">
  import { onMount } from 'svelte';

  export let scholarship: {
    id: string;
    title: string;
    provider: string;
    deadline: string;
    description?: string;
  };

  let showOptions = false;

  function generateCalendarLinks() {
    const title = encodeURIComponent(`${scholarship.title} - Application Deadline`);
    const details = encodeURIComponent(
      `Scholarship: ${scholarship.title}\n` +
      `Provider: ${scholarship.provider}\n` +
      `Deadline: ${new Date(scholarship.deadline).toLocaleDateString()}\n\n` +
      `Don't forget to submit your application before the deadline!\n` +
      `Track your progress: https://abroaducate.com/scholarships/my-applications`
    );
    
    const startDate = new Date(scholarship.deadline);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startISO = formatDate(startDate);
    const endISO = formatDate(endDate);

    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startISO}/${endISO}&details=${details}&location=Online`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startISO}&enddt=${endISO}&body=${details}`,
      yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${startISO}&et=${endISO}&desc=${details}`,
      ics: createICSFile()
    };
  }

  function createICSFile() {
    const startDate = new Date(scholarship.deadline);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Abroaducate//Scholarship Tracker//EN',
      'BEGIN:VEVENT',
      `UID:scholarship-${scholarship.id}@abroaducate.com`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${scholarship.title} - Application Deadline`,
      `DESCRIPTION:Scholarship: ${scholarship.title}\\nProvider: ${scholarship.provider}\\nDeadline: ${new Date(scholarship.deadline).toLocaleDateString()}\\n\\nDon't forget to submit your application before the deadline!\\nTrack your progress: https://abroaducate.com/scholarships/my-applications`,
      'LOCATION:Online',
      `DTSTAMP:${formatICSDate(new Date())}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'PRIORITY:5',
      'CLASS:PUBLIC',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Scholarship deadline reminder',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P3D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Scholarship deadline in 3 days',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  }

  function openCalendar(provider: string) {
    const links = generateCalendarLinks();
    
    if (provider === 'ics') {
      // Download ICS file
      const link = document.createElement('a');
      link.href = links.ics;
      link.download = `${scholarship.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_deadline.ics`;
      link.click();
    } else {
      // Open calendar in new tab
      window.open(links[provider as keyof typeof links], '_blank');
    }
    
    showOptions = false;
  }

  function formatDeadlineDate(deadline: string) {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    if (diffDays === 0) return `${formatted} (Today!)`;
    if (diffDays === 1) return `${formatted} (Tomorrow)`;
    if (diffDays > 0) return `${formatted} (${diffDays} days)`;
    return `${formatted} (Overdue)`;
  }
</script>

<div class="calendar-integration">
  <button 
    class="calendar-button"
    on:click={() => showOptions = !showOptions}
    title="Add to Calendar"
  >
    📅 Add to Calendar
  </button>

  {#if showOptions}
    <div class="calendar-options">
      <div class="options-header">
        <h3>Add Deadline to Calendar</h3>
        <button 
          class="close-button"
          on:click={() => showOptions = false}
          title="Close"
        >
          ✕
        </button>
      </div>
      
      <div class="deadline-info">
        <p class="scholarship-title">{scholarship.title}</p>
        <p class="deadline-date">{formatDeadlineDate(scholarship.deadline)}</p>
      </div>

      <div class="calendar-providers">
        <button 
          class="provider-button google"
          on:click={() => openCalendar('google')}
        >
          <span class="provider-icon">📧</span>
          <span class="provider-info">
            <span class="provider-name">Google Calendar</span>
            <span class="provider-desc">Add to your Google account</span>
          </span>
        </button>

        <button 
          class="provider-button outlook"
          on:click={() => openCalendar('outlook')}
        >
          <span class="provider-icon">📮</span>
          <span class="provider-info">
            <span class="provider-name">Outlook Calendar</span>
            <span class="provider-desc">Microsoft Outlook/Hotmail</span>
          </span>
        </button>

        <button 
          class="provider-button yahoo"
          on:click={() => openCalendar('yahoo')}
        >
          <span class="provider-icon">📨</span>
          <span class="provider-info">
            <span class="provider-name">Yahoo Calendar</span>
            <span class="provider-desc">Yahoo Mail calendar</span>
          </span>
        </button>

        <button 
          class="provider-button ics"
          on:click={() => openCalendar('ics')}
        >
          <span class="provider-icon">📁</span>
          <span class="provider-info">
            <span class="provider-name">Download ICS File</span>
            <span class="provider-desc">Import to any calendar app</span>
          </span>
        </button>
      </div>

      <div class="reminder-info">
        <p class="reminder-text">
          📢 <strong>Automatic Reminders Included:</strong>
        </p>
        <ul class="reminder-list">
          <li>3 days before deadline</li>
          <li>1 day before deadline</li>
        </ul>
      </div>
    </div>
  {/if}
</div>

<style>
  .calendar-integration {
    position: relative;
    display: inline-block;
  }

  .calendar-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .calendar-button:hover {
    background-color: #e5e7eb;
    border-color: #9ca3af;
  }

  .calendar-options {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 50;
    width: 320px;
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    margin-top: 8px;
    padding: 0;
    overflow: hidden;
  }

  .options-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background-color: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
  }

  .options-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .close-button {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.2s;
  }

  .close-button:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .deadline-info {
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  .scholarship-title {
    margin: 0 0 4px 0;
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
    line-height: 1.4;
  }

  .deadline-date {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }

  .calendar-providers {
    padding: 16px 20px;
  }

  .provider-button {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .provider-button:last-child {
    margin-bottom: 0;
  }

  .provider-button:hover {
    border-color: #2563eb;
    background-color: #eff6ff;
  }

  .provider-icon {
    font-size: 20px;
    width: 24px;
    text-align: center;
  }

  .provider-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .provider-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  .provider-desc {
    font-size: 12px;
    color: #6b7280;
  }

  .reminder-info {
    padding: 16px 20px;
    background-color: #fef3c7;
    border-top: 1px solid #f3f4f6;
  }

  .reminder-text {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #92400e;
  }

  .reminder-list {
    margin: 0;
    padding-left: 16px;
    font-size: 11px;
    color: #92400e;
  }

  .reminder-list li {
    margin-bottom: 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .calendar-options {
      width: 280px;
      right: 0;
      left: auto;
    }
  }

  /* Calendar provider specific styles */
  .provider-button.google:hover {
    border-color: #4285f4;
    background-color: #e8f0fe;
  }

  .provider-button.outlook:hover {
    border-color: #0078d4;
    background-color: #deecf9;
  }

  .provider-button.yahoo:hover {
    border-color: #7b0099;
    background-color: #f4e6f7;
  }

  .provider-button.ics:hover {
    border-color: #059669;
    background-color: #d1fae5;
  }
</style> 