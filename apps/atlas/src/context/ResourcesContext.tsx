/* eslint-disable @typescript-eslint/no-empty-function */
import { useStarknet, useStarknetCall } from '@starknet-react/core';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toBN } from 'starknet/dist/utils/number';
import { bnToUint256, uint256ToBN } from 'starknet/dist/utils/uint256';
import { useGetExchangeRatesQuery } from '@/generated/graphql';
import {
  useLordsContract,
  useResources1155Contract,
  useExchangeContract,
} from '@/hooks/settling/stark-contracts';
import { resources } from '@/util/resources';

export type Resource = {
  resourceId: number;
  resourceName: string;
  amount: string;
  rate: string;
  lp: string;
  percentChange: number;
};

export type ResourceQty = {
  resourceId: number;
  qty: number;
};

export type LpQty = {
  resourceId: number;
  lpqty: number;
  currencyqty: number;
};

type ResourcesBalance = Array<Resource>;

const resourceMapping = resources.map((resource) => {
  return bnToUint256(toBN(resource.id));
});

const initBalance = resources.map((resource) => {
  return {
    resourceId: resource.id,
    resourceName: resource.trait,
    amount: '0',
    rate: '0',
    lp: '0',
    percentChange: 0,
  };
});

const ResourcesContext = createContext<{
  availableResourceIds: number[];
  selectedSwapResources: ResourceQty[];
  selectedSwapResourcesWithBalance: (Resource & ResourceQty & LpQty)[];
  addSelectedSwapResources: (resourceId?: number) => void;
  removeSelectedSwapResource: (resourceId: number) => void;
  updateSelectedSwapResourceQty: (resourceId: number, qty: number) => void;
  updateSelectedSwapResource: (
    resourceId: number,
    newResourceId: number
  ) => void;
  balance: ResourcesBalance;
  lordsBalance: string;
  updateBalance: () => void;
  getResourceById: (resourceId: number) => Resource | undefined;
  lpBalance: ResourcesBalance;
  selectedLpResources: LpQty[];
  updateSelectedLpResourceQty: (
    resourceId: number,
    lpqty: number,
    currencyqty: number
  ) => void;
}>(null!);

interface ResourceProviderProps {
  children: React.ReactNode;
}

export const ResourceProvider = (props: ResourceProviderProps) => {
  return (
    <ResourcesContext.Provider value={useResources()}>
      {props.children}
    </ResourcesContext.Provider>
  );
};

function useResources() {
  const { account } = useStarknet();
  const [balance, setBalance] = useState([...initBalance]);
  const [lordsBalance, setLordsBalance] = useState('0');
  const [lpBalance, setlpBalanceData] = useState([...initBalance]);

  const [availableResourceIds, setAvailableResourceIds] = useState<number[]>(
    resources.map((resource) => resource.id)
  );
  const [selectedSwapResources, setSelectedSwapResources] = useState<
    ResourceQty[]
  >([]);

  const [selectedLpResources, setSelectedLpResources] = useState<LpQty[]>([]);

  const { contract: resources1155Contract } = useResources1155Contract();
  const { contract: lordsContract } = useLordsContract();
  const { contract: exchangeContract } = useExchangeContract();

  const ownerAddressInt = toBN(account as string).toString();

  const { data: lordsBalanceData, refresh } = useStarknetCall({
    contract: lordsContract,
    method: 'balanceOf',
    args: [ownerAddressInt],
  });

  const { data: resourceBalanceData, refresh: updateBalance } = useStarknetCall(
    {
      contract: resources1155Contract,
      method: 'balanceOfBatch',
      args: [
        Array(resourceMapping.length).fill(ownerAddressInt),
        resourceMapping,
      ],
    }
  );

  const { data: lpBalanceData, refresh: updateLpBalance } = useStarknetCall({
    contract: exchangeContract,
    method: 'balanceOfBatch',
    args: [
      Array(resourceMapping.length).fill(ownerAddressInt),
      resourceMapping,
    ],
  });

  const { data: exchangeRateData } = useGetExchangeRatesQuery({
    pollInterval: 5000,
  });

  const addSelectedSwapResources = (resourceId?: number) => {
    if (availableResourceIds.length === 0) {
      return;
    }
    const select = resourceId ?? availableResourceIds[0];
    setSelectedSwapResources([
      ...selectedSwapResources,
      { resourceId: select, qty: 0 },
    ]);
    setSelectedLpResources([
      ...selectedLpResources,
      { resourceId: select, lpqty: 0, currencyqty: 0 },
    ]);
  };

  const removeSelectedSwapResource = (resourceId: number) => {
    setSelectedSwapResources(
      selectedSwapResources.filter((item) => item.resourceId !== resourceId)
    );
  };

  const updateSelectedSwapResource = (
    resourceId: number,
    newResourceId: number
  ) => {
    setSelectedSwapResources(
      selectedSwapResources.map((resource) => {
        if (resource.resourceId === resourceId) {
          return { ...resource, resourceId: newResourceId };
        }
        return resource;
      })
    );
  };

  const updateSelectedSwapResourceQty = (resourceId: number, qty: number) => {
    setSelectedSwapResources(
      selectedSwapResources.map((resource) =>
        resource.resourceId === resourceId
          ? { ...resource, qty: qty }
          : { ...resource }
      )
    );
  };

  const updateSelectedLpResourceQty = (
    resourceId: number,
    lpqty: number,
    currencyqty: number
  ) => {
    setSelectedLpResources(
      selectedLpResources.map((resource) =>
        resource.resourceId === resourceId
          ? { ...resource, lpqty: lpqty, currencyqty: currencyqty }
          : { ...resource }
      )
    );
  };

  useEffect(() => {
    if (!lordsBalanceData || !lordsBalanceData[0]) {
      return;
    }
    setLordsBalance(uint256ToBN(lordsBalanceData[0]).toString(10));
  }, [lordsBalanceData]);

  useEffect(() => {
    setAvailableResourceIds(
      resources
        .map((resource) => resource.id)
        .filter(
          (resourceId) =>
            selectedSwapResources.find(
              (resource) => resource.resourceId === resourceId
            ) === undefined
        )
    );
  }, [selectedSwapResources]);

  useEffect(() => {
    if (!resourceBalanceData || !resourceBalanceData[0]) {
      return;
    }
    if (!lpBalanceData || !lpBalanceData[0]) {
      return;
    }
    const rates = exchangeRateData?.getExchangeRates ?? [];

    const lp = lpBalanceData[0].map((resourceBalance, index) => {
      return {
        amount: uint256ToBN(resourceBalance).toString(10),
      };
    });

    setBalance(
      resourceBalanceData[0].map((resourceBalance, index) => {
        const resourceId = index + 1;
        const rate = rates.find((rate) => rate.tokenId === resourceId);
        const rateAmount = rate?.amount ?? '0';
        const resourceName = rate?.tokenName ?? '';
        return {
          resourceId,
          resourceName,
          amount: uint256ToBN(resourceBalance).toString(10),
          rate: rateAmount ?? '0',
          lp: lp[index].amount,
          percentChange: rate?.percentChange24Hr ?? 0,
        };
      })
    );
  }, [resourceBalanceData, exchangeRateData]);

  const getResourceById = useCallback(
    (resourceId: number) => {
      return balance.find((resource) => resource.resourceId === resourceId);
    },
    [balance]
  );

  const getLpResourceById = useCallback(
    (resourceId: number) => {
      return selectedLpResources.find(
        (resource) => resource.resourceId === resourceId
      );
    },
    [selectedLpResources]
  );
  const selectedSwapResourcesWithBalance = useMemo(() => {
    return selectedSwapResources.map((resource) => {
      return {
        ...resource,
        ...getResourceById(resource.resourceId),
        ...getLpResourceById(resource.resourceId),
      } as Resource & ResourceQty & LpQty;
    });
  }, [selectedSwapResources, balance, selectedLpResources]);

  return {
    availableResourceIds,
    selectedSwapResources,
    selectedSwapResourcesWithBalance,
    addSelectedSwapResources,
    removeSelectedSwapResource,
    updateSelectedSwapResourceQty,
    updateSelectedSwapResource,
    balance,
    updateBalance,
    getResourceById,
    lordsBalance,
    lpBalance,
    selectedLpResources,
    updateSelectedLpResourceQty,
  };
}

export function useResourcesContext() {
  return useContext(ResourcesContext);
}
