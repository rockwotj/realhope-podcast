import {useEffect, useState} from 'react';
import {Box, Button, Center, Flex, Input, Spinner, Heading} from "@chakra-ui/react";
import {Youtube, FileVideo} from 'lucide-react';
import {SelectableIcon} from './SelectableIcon';
import {useFilePicker} from 'use-file-picker';
import {extractAudio} from './extract';

export interface PickerProps {
  readonly onVideoURL: (dataURL: string) => void;
}

export function Picker({onVideoURL}: PickerProps) {
  const [location, setLocation] = useState<'local' | 'youtube'>('local');
  return (
    <Flex flexDir='column' align='center' justify="start">
      <Flex flexDir='column' m='4' w='calc(100% - calc(var(--chakra-space-4) * 2))' minH='256px' borderWidth='1px' borderRadius='10' overflow="hidden" align="center">
        <Heading pt='4'>Upload a video</Heading>
        {location == 'local' ? <LocalFilePicker onVideoURL={onVideoURL} /> : <YoutubePicker onVideoURL={onVideoURL} />}
      </Flex>
      <Flex>
        <SelectableIcon selected={location == 'local'} onClick={() => setLocation('local')}>
          <FileVideo />
        </SelectableIcon>
        <SelectableIcon selected={location == 'youtube'} onClick={() => setLocation('youtube')}>
          <Youtube />
        </SelectableIcon>
      </Flex>
    </Flex>
  );
}

function YoutubePicker({}: PickerProps) {
  return (
    <Box p='12'>
      <Center flexDir='column'>
        <SelectableIcon selected>
          <Youtube />
        </SelectableIcon>
        <Input w='min-content' placeholder='Enter youtube link' m='4' />
        <Button>
          Load Video
        </Button>
      </Center>
    </Box>
  )
}

function LocalFilePicker({onVideoURL}: PickerProps) {
  const {openFilePicker, filesContent, loading} = useFilePicker({
    accept: 'video/*,audio/*',
    readAs: 'ArrayBuffer',
    multiple: false,
  });
  useEffect(() => {
    if (filesContent.length > 0) {
      const {content, type} = filesContent[0];
      // TODO(rockwood): GC this properly...
      const objectURL = URL.createObjectURL(new Blob([content], {type}));
      extractAudio(objectURL, {start: 0, end: 1, channel: 'mono'}).then(() => {
        onVideoURL(objectURL);
      });
    }
  });
  return (
    <Box p='12'>
      <Center mb='4'>
        <SelectableIcon selected>
          <FileVideo />
        </SelectableIcon>
      </Center>
      <Button onClick={openFilePicker}>
        {!loading && filesContent.length === 0 ? 'Upload Video' : <Spinner mx="4" />}
      </Button>
    </Box>
  )
}
