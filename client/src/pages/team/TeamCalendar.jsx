import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock, Flag, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Events keyed by "YYYY-M-D"
const events = {
  '2026-3-17': [
    { id: 1, title: 'Sprint Planning', type: 'meeting', time: '10:00 AM', color: 'bg-violet-500', dot: 'bg-violet-400' },
    { id: 2, title: 'Design Review', type: 'meeting', time: '2:00 PM', color: 'bg-sky-500', dot: 'bg-sky-400' },
  ],
  '2026-3-20': [
    { id: 3, title: 'Homepage wireframes due', type: 'deadline', time: 'All day', color: 'bg-rose-500', dot: 'bg-rose-400' },
  ],
  '2026-3-22': [
    { id: 4, title: 'Client Demo — TechCorp', type: 'meeting', time: '3:00 PM', color: 'bg-emerald-500', dot: 'bg-emerald-400' },
  ],
  '2026-3-25': [
    { id: 5, title: 'Brand Identity milestone', type: 'milestone', time: 'All day', color: 'bg-amber-500', dot: 'bg-amber-400' },
    { id: 6, title: 'Team retrospective', type: 'meeting', time: '11:00 AM', color: 'bg-violet-500', dot: 'bg-violet-400' },
  ],
  '2026-3-28': [
    { id: 7, title: 'Dashboard Analytics delivery', type: 'deadline', time: 'All day', color: 'bg-rose-500', dot: 'bg-rose-400' },
  ],
  '2026-4-1': [
    { id: 8, title: 'Q2 Kickoff meeting', type: 'meeting', time: '9:00 AM', color: 'bg-sky-500', dot: 'bg-sky-400' },
  ],
  '2026-4-5': [
    { id: 9, title: 'Mobile App MVP review', type: 'milestone', time: '1:00 PM', color: 'bg-amber-500', dot: 'bg-amber-400' },
  ],
  '2026-4-15': [
    { id: 10, title: 'Horizon SaaS launch', type: 'milestone', time: 'All day', color: 'bg-emerald-500', dot: 'bg-emerald-400' },
  ],
};

const typeConfig = {
  meeting: { icon: Users, label: 'Meeting', variant: 'info' },
  deadline: { icon: Flag, label: 'Deadline', variant: 'destructive' },
  milestone: { icon: Clock, label: 'Milestone', variant: 'warning' },
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function TeamCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const goToPrev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const goToNext = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const selectedKey = `${currentYear}-${currentMonth + 1}-${selectedDay}`;
  const selectedEvents = events[selectedKey] || [];

  const totalDays = firstDay + daysInMonth;
  const totalCells = Math.ceil(totalDays / 7) * 7;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <Button variant="outline" onClick={goToToday} className="self-start sm:self-auto border-white/10 text-white/60 hover:text-white gap-2 text-sm">
          <Calendar className="w-4 h-4" /> Today
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card className="bg-white/[0.04] border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-white">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={goToPrev} className="w-8 h-8 p-0 text-white/50 hover:text-white">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={goToNext} className="w-8 h-8 p-0 text-white/50 hover:text-white">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d} className="text-center text-xs text-white/30 font-medium py-1">{d}</div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: totalCells }).map((_, i) => {
                  const dayNum = i - firstDay + 1;
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                  const isToday = isValid && dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                  const isSelected = isValid && dayNum === selectedDay;
                  const key = `${currentYear}-${currentMonth + 1}-${dayNum}`;
                  const dayEvents = events[key] || [];

                  return (
                    <button
                      key={i}
                      onClick={() => isValid && setSelectedDay(dayNum)}
                      className={cn(
                        'min-h-[52px] p-1.5 rounded-lg text-xs transition-all flex flex-col items-center gap-1 relative',
                        !isValid && 'opacity-0 pointer-events-none',
                        isValid && !isSelected && !isToday && 'hover:bg-white/[0.06] text-white/50',
                        isToday && !isSelected && 'bg-violet-600/20 text-violet-300 border border-violet-500/30',
                        isSelected && 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                      )}
                    >
                      <span className={cn('font-medium', isToday && !isSelected && 'text-violet-300', isSelected && 'text-white')}>
                        {isValid ? dayNum : ''}
                      </span>
                      {isValid && dayEvents.length > 0 && (
                        <div className="flex gap-0.5 flex-wrap justify-center">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <div key={ev.id} className={cn('w-1.5 h-1.5 rounded-full', ev.dot)} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected Day Events */}
        <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible">
          <Card className="bg-white/[0.04] border-white/10 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white/80">
                {MONTH_NAMES[currentMonth]} {selectedDay}
              </CardTitle>
              <p className="text-xs text-white/30">{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</p>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <AnimatePresence mode="wait">
                {selectedEvents.length > 0 ? (
                  <motion.div
                    key={selectedKey}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-3"
                  >
                    {selectedEvents.map((event) => {
                      const TypeIcon = typeConfig[event.type]?.icon || Calendar;
                      return (
                        <div key={event.id} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={cn('p-1.5 rounded-lg', event.color + '/20')}>
                                <TypeIcon className={cn('w-3.5 h-3.5', event.color.replace('bg-', 'text-').replace('-500', '-400'))} />
                              </div>
                              <p className="text-sm font-medium text-white leading-tight">{event.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/40 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {event.time}
                            </span>
                            <Badge variant={typeConfig[event.type]?.variant || 'outline'} className="text-[10px] px-1.5">
                              {typeConfig[event.type]?.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedKey + 'empty'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <Calendar className="w-10 h-10 text-white/15 mx-auto mb-2" />
                    <p className="text-sm text-white/30">No events this day</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
