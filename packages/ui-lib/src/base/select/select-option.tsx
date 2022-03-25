import { Listbox } from '@headlessui/react';
import clsx from 'clsx';
import React from 'react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

interface SelectOptionProps extends Omit<ComponentProps<'li'>, 'value'> {
  value: unknown;
  label: ReactNode;
  selectedIcon: ReactElement;
}

export const SelectOption = ({
  value,
  label,
  selectedIcon,
  ...props
}: SelectOptionProps) => {
  return (
    <Listbox.Option
      className={({ active }) =>
        clsx(
          'relative cursor-pointer select-none py-2 pl-10 pr-4',
          active ? 'bg-gray-600/70' : 'bg-gray-800/70'
        )
      }
      value={value}
      {...props}
    >
      {({ selected, active }) => (
        <>
          <span className="block text-sm truncate">{label}</span>
          {selected ? (
            <span
              className={clsx(
                'absolute inset-y-0 left-0 flex items-center pl-3',
                active ? 'text-gray-600' : 'text-gray-400'
              )}
            >
              {selectedIcon}
            </span>
          ) : null}
        </>
      )}
    </Listbox.Option>
  );
};
