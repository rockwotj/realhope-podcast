import {useEffect, useMemo, useRef, useState} from 'react';
import {Box, Button, Center, Flex, FormControl, FormLabel, Heading, Input, Spacer, Spinner, Text, useTheme} from "@chakra-ui/react";
import {Play, Pause} from 'lucide-react';
import {useWavesurfer} from '@wavesurfer/react';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.js';
import {formatDuration} from './duration';
import {SelectableIcon} from './SelectableIcon';
import {SingleDatepicker} from 'chakra-dayzed-datepicker';

export interface TrimmerOutput {
  readonly title: string;
  readonly start: number;
  readonly end: number;
  readonly url: string;
  readonly date: Date;
  readonly duration: number; // in seconds
};

interface TrimmerProps {
  readonly url: string;
  readonly onSubmit: (output: TrimmerOutput) => void;
}


export function Trimmer({url, onSubmit}: TrimmerProps) {
  const containerRef = useRef(null);
  const [start, setStart] = useState(NaN);
  const [end, setEnd] = useState(NaN);
  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState(() => generateDefaultTitle());
  const theme = useTheme();
  const plugins = useMemo(() => [new RegionsPlugin(), new HoverPlugin({})], []);
  const {wavesurfer, isPlaying, currentTime} = useWavesurfer({
    container: containerRef,
    height: 100,
    waveColor: theme.colors.blue['100'],
    progressColor: theme.colors.blue['300'],
    url,
    plugins,
    backend: 'WebAudio',
  });
  const plugin = plugins[0] as RegionsPlugin;
  useEffect(() => {
    if (wavesurfer == null) return;
    if (plugin.getRegions().length > 0) return;
    if (wavesurfer.getDuration() == 0) return;
    const region = plugin.addRegion({
      id: 'selection',
      start: 0,
      end: wavesurfer.getDuration(),
      drag: true,
      resize: true,
    });
    region.on('update-end', () => {
      setStart(region.start);
      setEnd(region.end);
    });
    setStart(region.start);
    setEnd(region.end);
  });
  const isLoading = Number.isNaN(start) || Number.isNaN(end);
  return (
    <Flex flexDir='column' align='center' >
      <Box m='4' py='4' w='md' minH='256px' borderWidth='1px' borderRadius='10' overflow='hidden'>
        <Heading textAlign='center' py='4'>Create Podcast</Heading>
        <Box ref={containerRef} />
        {isLoading ? <Center><Spinner /></Center> :
          <>
            <Flex mx='2'>
              <SelectableIcon selected onClick={() => wavesurfer?.playPause()}>
                {!isPlaying ? <Play /> : <Pause />}
              </SelectableIcon>
              <Spacer />
              <Text>{formatDuration(currentTime)}</Text>
            </Flex>
            <Box m='2'>
              <FormControl isRequired>
                <FormLabel>Podcast Title</FormLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormControl>
              <Spacer m='2' />
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <SingleDatepicker
                  name="date-input"
                  date={date}
                  onDateChange={setDate}
                />
              </FormControl>
              <Spacer m='2' />
              <Button onClick={() => onSubmit({start, end, title, url, date, duration: end - start})}>
                Upload Podcast
              </Button>
            </Box>
          </>
        }
      </Box>
    </Flex>
  );
}

function generateDefaultTitle(): string {
  return `Sermon Title (Matthew Chapter XX)`;
}

