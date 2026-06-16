import { useEffect, useState } from "react";

export default function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="analog-clock">
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          className="clock-tick"
          key={index}
          style={{ transform: `rotate(${index * 30}deg) translateY(-24px)` }}
        />
      ))}
      <div
        className="hand hour"
        style={{ transform: `rotate(${hourDeg}deg)` }}
      />
      <div
        className="hand minute"
        style={{ transform: `rotate(${minuteDeg}deg)` }}
      />
      <div
        className="hand second"
        style={{ transform: `rotate(${secondDeg}deg)` }}
      />
      <div className="clock-center"></div>
    </div>
  );
}
