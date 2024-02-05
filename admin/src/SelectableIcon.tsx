import {Children, MouseEventHandler, PropsWithChildren, cloneElement} from 'react';
import {Box, useTheme} from "@chakra-ui/react";
import {LucideProps} from 'lucide-react';

export interface SelectableIconProps {
  readonly selected?: boolean;
  readonly onClick?: MouseEventHandler;
}

export function SelectableIcon({selected, onClick, children}: PropsWithChildren<SelectableIconProps>) {
  const theme = useTheme();
  const child = Children.only(children);
  const icon = cloneElement<LucideProps>(child as any, {color: theme.colors['white']});
  return (
    <Box m='2' p='2' borderRadius='100%'
      cursor={onClick && 'pointer'}
      bg={selected ? 'blue.400' : 'gray.300'}
      onClick={onClick}>
      {icon}
    </Box>
  );
}

