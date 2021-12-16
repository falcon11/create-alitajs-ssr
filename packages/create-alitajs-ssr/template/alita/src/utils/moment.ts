import dayjs from 'dayjs';
import _relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(_relativeTime);

const relativeTime = (time: number) => dayjs(new Date(time * 1000)).fromNow();

export { relativeTime };