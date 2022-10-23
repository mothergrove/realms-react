import {
  Table,
  Button,
  ResourceIcon,
  Spinner,
  CountdownTimer,
} from '@bibliotheca-dao/ui-lib';
import { formatEther } from '@ethersproject/units';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import {
  BASE_RESOURCES_PER_DAY,
  DAY,
  MAX_DAYS_ACCURED,
  PILLAGE_AMOUNT,
} from '@/constants/buildings';
import { findResourceById } from '@/constants/resources';
import { useCommandList } from '@/context/CommandListContext';
import type { Realm } from '@/generated/graphql';
import { useMarketRate } from '@/hooks/market/useMarketRate';
import { ModuleAddr } from '@/hooks/settling/stark-contracts';
import useResources, { Entrypoints } from '@/hooks/settling/useResources';
import useIsOwner from '@/hooks/useIsOwner';
import { RateChange } from '@/shared/Getters/Market';
import type { RealmsCardProps } from '@/types/index';

type Row = {
  resource: ReactElement;
  claimableResources: string | ReactElement;
};

type Prop = {
  showRaidable?: boolean;
  showClaimable?: boolean;
  showLevel?: boolean;
  hideLordsClaimable?: boolean;
  hideDaysAccrued?: boolean;
  header?: React.ReactNode;
  size?: string;
};

export function RealmResources(props: RealmsCardProps & Prop): ReactElement {
  const { exchangeInfo } = useMarketRate();

  const DAY_MS = DAY * 1000;
  const getDays = (time) => {
    return Math.trunc((Date.now() - time) / DAY_MS);
  };

  const remainingDays = (time) => {
    const offsetClaimtime = time % DAY_MS;
    const remainingDay = DAY_MS - (Date.now() % DAY_MS);
    return remainingDay + offsetClaimtime + Date.now();
  };

  const { claim } = useResources(props.realm as Realm);
  const isOwner = useIsOwner(props.realm?.settledOwner);

  // days accrued
  const cachedDaysAccrued = getDays(props.realm?.lastClaimTime);

  // time until next claim
  const cachedDaysRemained = remainingDays(props.realm?.lastClaimTime);

  // vault accrued
  const cachedVaultDaysAccrued = getDays(props.realm?.lastVaultTime);

  // adds the base amount to the claimable
  const maxResources =
    cachedDaysAccrued > MAX_DAYS_ACCURED
      ? BASE_RESOURCES_PER_DAY * MAX_DAYS_ACCURED
      : 0;

  const resourcesAccrued = cachedDaysAccrued * BASE_RESOURCES_PER_DAY;
  const resourceVaultAccrued = cachedVaultDaysAccrued * BASE_RESOURCES_PER_DAY;

  const vaultAccrued = resourceVaultAccrued * (PILLAGE_AMOUNT / 100);

  const days =
    cachedDaysAccrued > MAX_DAYS_ACCURED ? MAX_DAYS_ACCURED : cachedDaysAccrued;

  const resources = props.realm.resources?.map((a) => {
    return maxResources.toLocaleString();
  });

  const vault = props.realm.resources?.map((a) => {
    return vaultAccrued.toLocaleString();
  });

  const getRateChange = (id) => {
    return exchangeInfo?.find((a) => a.tokenId === id)?.percentChange24Hr || 0;
  };
  const getRate = (id) => {
    return (+formatEther(
      exchangeInfo?.find((a) => a.tokenId === id)?.sellAmount || 0
    )).toFixed(3);
  };
  const mappedRowData: Row[] = (props.realm.resources as any).map(
    (re, index) => {
      const mappedData = {
        resource: (
          <span className="flex text-xs">
            <ResourceIcon
              resource={
                findResourceById(re.resourceId)?.trait.replace(' ', '') || ''
              }
              size="sm"
              className="self-center mr-4"
            />
            <span className="self-center tracking-widest uppercase">
              {re.resourceName || ''} <br />{' '}
              {RateChange(getRateChange(re.resourceId))}{' '}
              <span className="text-xs ">[{getRate(re.resourceId)}]</span>
            </span>
          </span>
        ),
        // baseOutput: 100,
      };
      {
        /* eslint-disable */
      }
      if (props.showClaimable) {
        Object.assign(mappedData, {
          claimableResources: (
            <span className="w-full text-center">
              {(resources && resources[index]) || (
                <Spinner size="md" scheme="white" variant="circle" />
              )}{' '}
            </span>
          ),
        });
      }
      if (props.showRaidable) {
        Object.assign(mappedData, {
          raidableResources: (
            <span className="w-full text-center">
              {(vault && vault[index]) || (
                <Spinner size="md" scheme="white" variant="circle" />
              )}
            </span>
          ),
        });
      }
      return mappedData;
    }
  );

  const txQueue = useCommandList();
  const [enqueuedHarvestTx, setEnqueuedHarvestTx] = useState(false);

  useEffect(() => {
    setEnqueuedHarvestTx(
      !!txQueue.transactions.find(
        (t) =>
          t.contractAddress == ModuleAddr.ResourceGame &&
          t.entrypoint == Entrypoints.claim &&
          t.metadata.realmId == props.realm.realmId
      )
    );
  }, [txQueue.transactions]);

  const columns = [
    { Header: '', id: 1, accessor: 'resource' },
    // { Header: 'Base Output', id: 2, accessor: 'baseOutput' },
    props.showClaimable
      ? { Header: 'Claim', id: 2, accessor: 'claimableResources' }
      : undefined,
    props.showRaidable
      ? { Header: 'Raid', id: 3, accessor: 'raidableResources' }
      : undefined,
    props.showLevel ? { Header: 'level', id: 4, accessor: 'level' } : undefined,
  ].filter((i) => i !== undefined);

  const tableOptions = { is_striped: true };

  return (
    <div className="w-full font-display ">
      <div className="flex justify-around flex-grow w-full p-4 text-center">
        <div className="w-full sm:w-1/2">
          <h6>work days</h6>
          <div className="mt-3 sm:text-5xl">
            {days === MAX_DAYS_ACCURED ? `${MAX_DAYS_ACCURED}` : days}{' '}
            <span className="opacity-50"> / 3</span>
          </div>{' '}
          {days != MAX_DAYS_ACCURED && (
            <div className="flex justify-between px-3 uppercase">
              <CountdownTimer date={cachedDaysRemained.toString()} />
            </div>
          )}
        </div>
        <div className="border-r-4 border-double border-white/30"></div>
        <div className="w-full sm:w-1/2">
          <h6>vault days</h6>
          <div className="mt-3 sm:text-5xl">{cachedVaultDaysAccrued}</div>{' '}
        </div>
      </div>
      {props.header}
      <Table columns={columns} data={mappedRowData} options={tableOptions} />
      {isOwner && (
        <div className="flex w-full mt-4 space-x-3">
          <Button
            disabled={enqueuedHarvestTx || days === 0}
            size="xs"
            variant={days === 0 ? 'outline' : 'primary'}
            className="w-full"
            onClick={() => {
              claim();
            }}
          >
            {days === 0 ? 'nothing to harvest' : 'Harvest Resources'}
          </Button>
        </div>
      )}
    </div>
  );
}
