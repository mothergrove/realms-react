import {
  Card,
  CardTitle,
  Button,
  CountdownTimer,
  InputNumber,
  ResourceIcon,
} from '@bibliotheca-dao/ui-lib/base';
import { Tooltip } from '@bibliotheca-dao/ui-lib/base/utility';
import ChevronDown from '@bibliotheca-dao/ui-lib/icons/chevron-down.svg';
import ChevronUp from '@bibliotheca-dao/ui-lib/icons/chevron-up.svg';
import { formatEther } from '@ethersproject/units';
import type { ValueType } from '@rc-component/mini-decimal';
import { BigNumber } from 'ethers';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { CostBlock, getPopulation } from '@/components/realms/RealmsGetters';

import {
  RealmBuildingId,
  HarvestType,
  HARVEST_LENGTH,
  MAX_HARVESTS,
  BASE_FOOD_PRODUCTION,
  FISH_ID,
  WHEAT_ID,
  buildingIdToString,
  buildingImageById,
} from '@/constants/globals';
import { useCommandList } from '@/context/CommandListContext';
import { useUserBalancesContext } from '@/context/UserBalancesContext';
import type { Realm, RealmFragmentFragment } from '@/generated/graphql';
import { ModuleAddr } from '@/hooks/settling/stark-contracts';
import { useCurrentQueuedTxs } from '@/hooks/settling/useCurrentQueuedTxs';
import useFood, { Entrypoints } from '@/hooks/settling/useFood';
import { useGameConstants } from '@/hooks/settling/useGameConstants';
import useIsOwner from '@/hooks/useIsOwner';
import type { BuildingDetail, RealmFoodDetails } from '@/types/index';

type Prop = {
  realm: RealmFragmentFragment;
  buildings: BuildingDetail[] | undefined;
  realmFoodDetails: RealmFoodDetails;
  availableFood: number | undefined;
  loading: boolean;
};

const getTrait = (realm: any, trait: string) => {
  return realm?.traits?.find((o) => o.type === trait)
    ? realm.traits?.find((o) => o.type === trait).qty
    : '0';
};

interface ResourceAndFoodInput {
  farmsToBuild: string;
  fishingVillagesToBuild: string;
  fishConversion: string;
  wheatConversion: string;
}

export const RealmsFood = (props: Prop) => {
  const { realm, buildings, realmFoodDetails, availableFood, loading } = props;

  const { balance } = useUserBalancesContext();
  const { getBuildingCostById } = useGameConstants();
  const { create, harvest, convert } = useFood(realm as Realm);
  const isOwner = useIsOwner(realm?.settledOwner);

  const getFishBalance =
    balance.find((a) => a.resourceId === FISH_ID)?.amount || '0';
  const getWheatBalance =
    balance.find((a) => a.resourceId === WHEAT_ID)?.amount || '0';

  const { enqueuedHarvestTx: harvestFarmEnqueuedHarvestTx } =
    useCurrentQueuedTxs({
      moduleAddr: ModuleAddr.Food,
      entryPoint: Entrypoints.harvest,
      realmId: realm?.realmId,
    });

  const farmCapacity = getTrait(realm, 'River');
  const fishingVillageCapacity = getTrait(realm, 'Harbor');

  const [input, setInput] = useState<ResourceAndFoodInput>({
    farmsToBuild: farmCapacity,
    fishingVillagesToBuild: fishingVillageCapacity,
    fishConversion: '1000',
    wheatConversion: '1000',
  });

  const farmCosts = getBuildingCostById(RealmBuildingId.Farm);
  const fishingVillageCosts = getBuildingCostById(
    RealmBuildingId.FishingVillage
  );

  return (
    <div>
      <div className="grid items-start grid-cols-3 gap-2">
        <div className="relative flex flex-wrap w-full pb-2 border rounded border-white/10">
          <div className="relative">
            <img
              alt="Storehouse"
              className={' mx-auto w-full rounded-xl '}
              src={buildingImageById(RealmBuildingId.StoreHouse)}
            />
            <div className="absolute top-0 w-full p-4 text-white bg-gradient-to-b from-gray-900 rounded-t-xl">
              <h3 className="flex justify-between p-1 px-2 ">Storehouse</h3>
            </div>
            <div className="absolute bottom-0 flex items-center w-full p-8 bg-gradient-to-t from-gray-900 rounded-t-xl rounded-xl">
              <div className="self-center mr-3 text-3xl">
                {availableFood?.toLocaleString()
                  ? availableFood?.toLocaleString()
                  : '0 Food in Store'}
              </div>
              {availableFood && availableFood > 0 ? (
                <div className="flex justify-end p-1 rounded bg-black/70">
                  <CountdownTimer
                    date={(
                      (availableFood / getPopulation(realm)) * 1000 +
                      new Date().getTime()
                    ).toString()}
                  />
                </div>
              ) : (
                <span className="self-center">
                  Ser, your serfs are starving!!
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between w-full p-3 font-semibold">
            <div className="flex ">
              <div className="mr-3">
                <ResourceIcon
                  className="self-center"
                  resource={'Wheat'}
                  size="sm"
                />
              </div>

              <span className="self-center">Wheat</span>
            </div>
            <span>{(+formatEther(getWheatBalance ?? 0)).toLocaleString()}</span>
          </div>

          <div className="flex justify-between w-full px-2 pb-2">
            <Button
              onClick={() => {
                convert(realm?.realmId, input.wheatConversion, WHEAT_ID);
              }}
              size="md"
              variant="outline"
            >
              Store
            </Button>
            <InputNumber
              value={input.wheatConversion}
              inputSize="md"
              colorScheme="transparent"
              className="w-2/3 mx-2 text-xl border rounded bg-black/10 border-white/10"
              min={1}
              inputClass="h-full mt-3"
              max={10000000}
              stringMode
              onChange={(value: ValueType | null) => {
                if (value) {
                  setInput((current) => {
                    return {
                      ...current,
                      wheatConversion: value.toString(),
                    };
                  });
                }
              }}
            />
            <div className="flex flex-grow">
              <div className="flex flex-col flex-grow">
                <Button
                  onClick={() => {
                    setInput((current) => {
                      return {
                        ...current,
                        wheatConversion: (
                          parseInt(current.wheatConversion) + 10000
                        ).toString(),
                      };
                    });
                  }}
                  size="xs"
                  variant="unstyled"
                  className="flex justify-center px-2 border rounded border-white/10 hover:bg-white/10"
                >
                  <ChevronUp />
                </Button>
                <Button
                  size="xs"
                  variant="unstyled"
                  onClick={() => {
                    setInput((current) => {
                      return {
                        ...current,
                        wheatConversion: (
                          parseInt(current.wheatConversion) - 10000
                        ).toString(),
                      };
                    });
                  }}
                  className="flex justify-center px-2 border rounded border-white/10 hover:bg-white/10"
                >
                  <ChevronDown />
                </Button>
              </div>
              <div className="flex flex-col flex-grow uppercase">
                <Button
                  size="xs"
                  variant="unstyled"
                  className="px-2 border rounded border-white/10 hover:bg-white/10"
                  onClick={() => {
                    setInput((current) => {
                      return {
                        ...current,
                        wheatConversion: (+formatEther(
                          getWheatBalance ?? 0
                        )).toString(),
                      };
                    });
                  }}
                >
                  all
                </Button>
                <Button
                  size="xs"
                  variant="unstyled"
                  className="px-2 border rounded border-white/10 hover:bg-white/10"
                  onClick={() => {
                    setInput((current) => {
                      return {
                        ...current,
                        wheatConversion: (
                          +formatEther(getWheatBalance ?? 0) / 2
                        ).toString(),
                      };
                    });
                  }}
                >
                  half
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between w-full p-3 font-semibold">
            <div className="flex ">
              <ResourceIcon
                className="self-center mr-2"
                resource={'Fish'}
                size="sm"
              />
              <span>Fish</span>
            </div>

            <span>{(+formatEther(getFishBalance ?? 0)).toLocaleString()}</span>
          </div>

          <div className="flex justify-between w-full px-2">
            <Button
              onClick={() => {
                convert(realm?.realmId, input.fishConversion, FISH_ID);
              }}
              size="md"
              variant="outline"
            >
              Store
            </Button>
            <InputNumber
              value={input.fishConversion}
              inputSize="md"
              colorScheme="transparent"
              className="w-2/3 mx-2 text-xl border rounded bg-black/10 border-white/10"
              min={1}
              inputClass="h-full mt-3"
              max={10000000}
              stringMode
              onChange={(value: ValueType | null) => {
                if (value) {
                  setInput((current) => {
                    return {
                      ...current,
                      fishConversion: value.toString(),
                    };
                  });
                }
              }}
            />
            <div className="flex flex-grow">
              <div className="flex flex-col flex-grow">
                <Button
                  size="xs"
                  variant="unstyled"
                  className="flex justify-center px-2 border rounded border-white/10 hover:bg-white/10"
                  onClick={() => {
                    setInput((current) => {
                      return {
                        ...current,
                        fishConversion: (
                          parseInt(current.fishConversion) + 10000
                        ).toString(),
                      };
                    });
                  }}
                >
                  <ChevronUp />
                </Button>
                <Button
                  size="xs"
                  variant="unstyled"
                  className="flex justify-center px-2 border rounded border-white/10 hover:bg-white/10"
                  onClick={() => {
                    setInput((current) => {
                      return {
                        ...current,
                        fishConversion: (
                          parseInt(current.fishConversion) - 10000
                        ).toString(),
                      };
                    });
                  }}
                >
                  <ChevronDown />
                </Button>
              </div>
              <div className="flex flex-col flex-grow uppercase">
                <Button
                  size="xs"
                  variant="unstyled"
                  className="px-2 border rounded border-white/10 hover:bg-white/10"
                  onClick={() => {
                    setInput((current) => {
                      return {
                        ...current,
                        fishConversion: (+formatEther(
                          getFishBalance ?? 0
                        )).toString(),
                      };
                    });
                  }}
                >
                  all
                </Button>
                <Button
                  size="xs"
                  variant="unstyled"
                  className="px-2 border rounded border-white/10 hover:bg-white/10"
                  onClick={() => {
                    setInput((current) => {
                      return {
                        ...current,
                        fishConversion: (
                          +formatEther(getFishBalance ?? 0) / 2
                        ).toString(),
                      };
                    });
                  }}
                >
                  half
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="relative flex flex-wrap w-full pb-2 border rounded border-white/10">
          <FoodBuildingComponent
            realm={realm}
            id={RealmBuildingId.Farm}
            built={realmFoodDetails.farmsBuilt}
            capacity={farmCapacity}
            harvestsLeft={realmFoodDetails.farmHarvestsLeft}
            timeTillHarvest={realmFoodDetails.farmTimeTillHarvest}
            toHarvest={realmFoodDetails.farmsToHarvest}
            decayed={realmFoodDetails.farmsDecayed}
            costs={farmCosts}
          />
        </div>
        <div className="relative flex flex-wrap w-full pb-2 border rounded border-white/10">
          <FoodBuildingComponent
            realm={realm}
            id={RealmBuildingId.FishingVillage}
            built={realmFoodDetails.villagesBuilt}
            capacity={fishingVillageCapacity}
            harvestsLeft={realmFoodDetails.villagesHarvestsLeft}
            timeTillHarvest={realmFoodDetails.villagesTimeTillHarvest}
            toHarvest={realmFoodDetails.villagesToHarvest}
            decayed={realmFoodDetails.villagesDecayed}
            costs={fishingVillageCosts}
          />
        </div> */}
      </div>
    </div>
  );
};

export const FoodBuildingComponent = (props: {
  realm;
  id;
  built;
  capacity;
  harvestsLeft;
  timeTillHarvest;
  toHarvest;
  decayed;
  costs;
}) => {
  const {
    realm,
    id,
    toHarvest,
    built,
    capacity,
    harvestsLeft,
    timeTillHarvest,
    decayed,
    costs,
  } = props;

  const [qty, setQty] = useState(capacity || 1);

  const { create, harvest, convert } = useFood(realm as Realm);

  const txQueue = useCommandList();

  const [enqueuedHarvestTx, setEnqueuedHarvestTx] = useState(false);

  const [enqueuedBuildTx, setEnqueuedBuildTx] = useState(false);

  useEffect(() => {
    setEnqueuedHarvestTx(
      !!txQueue.transactions.find(
        (t: any) =>
          t.contractAddress == ModuleAddr.Food &&
          t.entrypoint == Entrypoints.harvest &&
          t.calldata &&
          BigNumber.from(t.calldata[0] as string).eq(
            BigNumber.from(realm.realmId)
          ) &&
          t.calldata[3] == id
      )
    );

    setEnqueuedBuildTx(
      !!txQueue.transactions.find(
        (t: any) =>
          t.contractAddress == ModuleAddr.Food &&
          t.entrypoint == Entrypoints.create &&
          t.calldata &&
          BigNumber.from(t.calldata[0] as string).eq(
            BigNumber.from(realm.realmId)
          ) &&
          t.calldata[3] == id
      )
    );
  }, [txQueue.transactions]);

  const cropLand = ({ level, color, built }) => {
    return Array.from({ length: level }, (item, index) => (
      <div key={index}>
        <div
          className={`h-2 p-2 border border-white/30 rounded flex m-1 ${
            toHarvest > 0 ? 'animate-pulse' : ''
          }  ${index < built ? color : ''}`}
        >
          <ResourceIcon
            size="xs"
            resource={id === RealmBuildingId.Farm ? 'Wheat' : 'Fish'}
          />
        </div>
      </div>
    ));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between ">
        <div className="relative">
          <img
            className={'mx-auto rounded-t-2xl'}
            src={buildingImageById(id)}
            alt="Hut"
          />
          <div className="absolute top-0 w-full p-4 text-white bg-gradient-to-b from-gray-900 rounded-t-xl">
            <h3 className="flex justify-between p-1 px-2 ">
              {buildingIdToString(id)}{' '}
              <span>
                {built} / {capacity}{' '}
              </span>
            </h3>
          </div>

          <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-gray-900">
            <p className="self-center px-2 text-white">
              {built} {buildingIdToString(id)} generating{' '}
              {(BASE_FOOD_PRODUCTION * built).toLocaleString()}{' '}
              {id === RealmBuildingId.Farm ? '$WHEAT' : '$FISH'} every{' '}
              {HARVEST_LENGTH / 60} minutes.
            </p>
          </div>
        </div>{' '}
        <div className="flex flex-wrap p-2">
          {' '}
          {cropLand({
            level: capacity,
            color:
              id === RealmBuildingId.Farm
                ? 'bg-yellow-300/30'
                : 'bg-blue-300/30',
            built: built,
          })}
        </div>
        <div className="flex flex-wrap justify-between w-full px-2 pb-2">
          <div className="w-full">
            <div className="flex flex-col">
              <div className="flex my-2">
                <h5>To Harvest: </h5>
                <div className="ml-2">
                  {toHarvest} / {MAX_HARVESTS}
                </div>
              </div>
              {harvestsLeft > 0 && (
                <div className="flex mb-2">
                  <h5>Next Harvest: </h5>
                  <div className="ml-2">
                    <CountdownTimer
                      statement={<div className="text-green-600">Now</div>}
                      date={(timeTillHarvest + new Date().getTime()).toString()}
                    />
                  </div>
                </div>
              )}
              <div className="flex mb-2">
                <h5>Harvests Left</h5>
                <div className="ml-2">{harvestsLeft}</div>
              </div>
            </div>
            <div>
              <Button
                onClick={() => {
                  harvest(
                    realm?.realmId,
                    HarvestType.Export,
                    id,
                    RealmBuildingId.Farm === id ? WHEAT_ID : FISH_ID
                  );
                }}
                size="xs"
                disabled={toHarvest === 0 || enqueuedHarvestTx}
                variant="primary"
              >
                {(BASE_FOOD_PRODUCTION * built * toHarvest).toLocaleString()}{' '}
                {RealmBuildingId.Farm === id ? '$WHEAT' : '$FISH'}
                {enqueuedHarvestTx ? ' Harvesting...' : ' to harvest'}
              </Button>
            </div>
          </div>

          <div className="w-full my-4">
            <div className="flex flex-wrap ">
              <div className="flex w-full space-x-2">
                <Tooltip
                  placement="top"
                  className="flex w-min"
                  tooltipText={
                    <div className="flex p-1 text-sm rounded bg-gray-1000 whitespace-nowrap">
                      {costs?.resources.map((a, i) => {
                        return (
                          <CostBlock
                            key={i}
                            resourceName={a.resourceName}
                            amount={a.amount}
                            id={a.resourceId}
                            qty={parseInt(qty) || 0}
                          />
                        );
                      })}
                    </div>
                  }
                >
                  <Button
                    onClick={() => {
                      create(realm?.realmId, qty, id, costs);
                    }}
                    size="xs"
                    variant="primary"
                    disabled={enqueuedBuildTx}
                  >
                    {enqueuedBuildTx ? 'Building...' : 'Build'}
                  </Button>
                </Tooltip>

                {capacity && (
                  <InputNumber
                    value={qty}
                    inputSize="sm"
                    colorScheme="transparent"
                    className="w-12 border rounded border-white/40"
                    min={1}
                    max={capacity}
                    stringMode
                    onChange={(value: ValueType | null) => {
                      setQty(value);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
