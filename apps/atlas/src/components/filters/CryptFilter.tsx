import { useCryptContext } from '@/context/CryptContext';
import { CryptEnvironmentFilter } from './CryptEnvironmentFilter';
import { CryptStatsFilter } from './CryptStatsFilter';
import { SearchFilter } from './SearchFilter';

export function CryptFilter() {
  const { state, actions } = useCryptContext();

  return (
    <div className="flex justify-between  my-2">
      <div className="w-full sm:w-auto">
        <SearchFilter
          placeholder="SEARCH BY ID"
          onSubmit={(value) => {
            actions.updateSearchIdFilter(parseInt(value) ? value : '');
          }}
          defaultValue={state.searchIdFilter + ''}
        />
      </div>
      <div className="flex ">
        <CryptEnvironmentFilter
          selectedValues={state.environmentsFilter}
          onChange={actions.updateEnvironmentsFilter}
        />
        <CryptStatsFilter
          stats={state.statsFilter}
          onChange={actions.updateStatsFilter}
        />
      </div>
    </div>
  );
}
