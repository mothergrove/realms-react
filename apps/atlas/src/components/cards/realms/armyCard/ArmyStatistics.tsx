import {
  Button,
  Card,
  CountdownTimer,
  OrderIcon,
  Tabs,
} from '@bibliotheca-dao/ui-lib/base';
import { RadarMap } from '@bibliotheca-dao/ui-lib/graph/Radar';
import Globe from '@bibliotheca-dao/ui-lib/icons/globe.svg';
import Head from '@bibliotheca-dao/ui-lib/icons/loot/head.svg';
import Map from '@bibliotheca-dao/ui-lib/icons/map.svg';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import { useMemo, useState } from 'react';
import { useAtlasContext } from '@/context/AtlasContext';
import type { Army } from '@/generated/graphql';
import { useArmy } from '@/hooks/settling/useArmy';
import { soundSelector, useUiSounds } from '@/hooks/useUiSounds';
import { fetchRealmNameById, getTravelTime } from '@/shared/Getters/Realm';
import type { ArmyStatistics as Stats } from '@/types/index';

export interface ArmyAndOrder extends Army {
  orderType?: string;
}

type Prop = {
  armyStatistics: Stats;
  army: ArmyAndOrder;
  onBuildArmy?: () => void;
  onTravel?: () => void;
  selectedRealm?: number;
  isAtLocation: boolean;
  isHome: boolean;
};

export const ArmyStatistics: React.FC<Prop> = (props) => {
  const { play } = useUiSounds(soundSelector.pageTurn);
  const army = props.army;

  const armyLocation =
    army.destinationRealmId == 0 ? army.realmId : army.destinationRealmId;

  const travelInformation = getTravelTime({
    travellerId: armyLocation,
    destinationId: props.selectedRealm,
  });

  const hasArrived = army?.destinationArrivalTime > new Date().getTime();

  return (
    <div key={army.armyId}>
      <div className="relative h-36">
        <ParentSize>
          {({ width, height }) => (
            <RadarMap
              armyOne={props.armyStatistics}
              height={height}
              width={width}
            />
          )}
        </ParentSize>
      </div>
      <div className="w-full mt-3 uppercase">
        <div className="flex justify-between">
          <h5 className="">Statistics</h5>
          <span className="pr-6 ml-auto">A</span> <span>D</span>
        </div>
        <hr className="border-white/30" />
        <div className="flex justify-between">
          Cavalry{' '}
          <span className="pr-3 ml-auto">
            {props.armyStatistics.cavalryAttack}
          </span>{' '}
          <span>{props.armyStatistics.cavalryDefence}</span>
        </div>
        <div className="flex justify-between">
          Archery{' '}
          <span className="pr-3 ml-auto">
            {props.armyStatistics.archeryAttack}
          </span>{' '}
          <span>{props.armyStatistics.archeryDefence}</span>
        </div>
        <div className="flex justify-between">
          Magic{' '}
          <span className="pr-3 ml-auto">
            {props.armyStatistics.magicAttack}
          </span>{' '}
          <span>{props.armyStatistics.magicDefence}</span>
        </div>
        <div className="flex justify-between">
          Infantry{' '}
          <span className="pr-3 ml-auto">
            {props.armyStatistics.infantryAttack}
          </span>{' '}
          <span>{props.armyStatistics.infantryDefence}</span>
        </div>
      </div>
    </div>
  );
};
