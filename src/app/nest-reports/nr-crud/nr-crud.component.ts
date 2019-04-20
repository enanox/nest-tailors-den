import { Component, OnInit } from '@angular/core';
import { NestReport } from '../models/nest-report';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Migration } from '../../migrations/model/migration';
import { MigrationsService } from '../../migrations/migrations.service';
import { NestingSpecies } from '../models/nesting-species';
import { NestingSpeciesService } from '../nesting-species.service';
import { SpawnPoint } from '../../spawn-points/models/spawn-point';
import { SpawnPointsService } from '../../spawn-points/spawnpoints.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NestReportsService } from '../nest-reports.service';
import { MessageService } from 'primeng/api';
import { CitiesService } from '../cities.service';
import { sortAsc } from 'src/app/utils/utils';

@Component({
  selector: 'app-nr-crud',
  templateUrl: './nr-crud.component.html',
  styleUrls: ['./nr-crud.component.scss']
})
export class NrCrudComponent implements OnInit {
  form: FormGroup;
  migration: Migration;
  spawnPoint: SpawnPoint;
  species: NestingSpecies;
  spottedBy: string;
  status: string = 'confirmed';
  confirmedBy: string;
  broadcastStatus: string;
  registeredMigrations: Migration[];
  registeredSpawnPoints: SpawnPoint[];
  nestingSpecies: NestingSpecies[];
  statusOptions = [];
  editingReport = false;
  paramReport: NestReport;
  cities = [
    /*{ label: 'Montevideo', value: 'Montevideo' },
    { label: 'Maldonado', value: 'Maldonado' },
    { label: 'Canelones', value: 'Canelones' },
    { label: 'San Carlos', value: 'San Carlos' },*/
  ];

  constructor(private fb: FormBuilder, private mgService: MigrationsService,
    private spService: SpawnPointsService, private nsService: NestingSpeciesService,
    private route: ActivatedRoute, private nrService: NestReportsService,
    private messageService: MessageService, private router: Router,
    private citiesService: CitiesService) { }

  ngOnInit() {
    // ToDo: refactor in a service
    this.statusOptions = [{
      label: 'Habilitado', value: { id: 1, name: 'Enabled' }
    }, {
      label: 'Deshabilitado', value: { id: 2, name: 'Disabled' }
    }, {
      label: 'Confirmado', value: { id: 3, name: 'Confirmed' }
    }, {
      label: 'Pendiente', value: { id: 4, name: 'Pending' }
    }, {
      label: 'Rechazado', value: { id: 5, name: 'Rejected' }
    }];

    this.mgService.getMigrationsList().subscribe((migrationList) => {
      this.registeredMigrations = migrationList;
    });

    this.spService.getSpawnPointList().subscribe((pointList) => {
      this.registeredSpawnPoints = pointList.sort(sortAsc('name'));
    });

    this.nsService.getFilteredSpecies().then((speciesList) => {
      this.nestingSpecies = speciesList;
    });

    this.form = this.fb.group({
      migration: [this.migration && this.migration.migrationId, Validators.required],
      spawnPoint: [this.spawnPoint && this.spawnPoint.pointId, Validators.required],
      species: [this.species && this.species.id, Validators.required],
      spottedBy: [this.spottedBy, Validators.required],
      status: [this.status],
      confirmedBy: [this.confirmedBy],
      broadcastStatus: [this.broadcastStatus]
    });

    const id = +(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.nrService.getNestReport(id).subscribe((report: NestReport) => {
        this.paramReport = report;

        if (!!report) {
          this.editingReport = !this.editingReport;
          this.form.setValue({
            migration: report.migration,
            spawnPoint: report.spawnPoint,
            species: report.species,
            spottedBy: report.spottedBy || '',
            status: report.status || { id: 3, name: 'Confirmed' },
            confirmedBy: report.confirmedBy.userName || '',
            broadcastStatus: report.broadcastStatus || ''
          });
        }
      });
    }
  }

  clearForm() {
    this.form.reset();
  }

  backToList() {
    history.back();
  }

  searchMigration(event: any) {
    this.mgService.getMigrationsList().subscribe((list) => {
      this.registeredMigrations = list.filter((migration) => {
        return migration.migrationId.toString().lastIndexOf(event.query) !== -1 || migration.visibleName.lastIndexOf(event.query) !== -1;
      }) || [];
    });
  }

  selectMigration(event) {
    this.migration = event;
  }

  searchSpecies(event: any) {
    this.nsService.getFilteredSpecies().then((list) => {
      this.nestingSpecies = list.filter((species) => {
        return species.name.toLowerCase().lastIndexOf(event.query.toLowerCase()) !== -1;
      }) || [];
    });
  }

  selectSpecies(event) {
    this.species = event;
  }

  searchSpawnPoints(event) {
    this.spService.getSpawnPointList().subscribe(list => {
      this.registeredSpawnPoints = list.sort(sortAsc('name')).filter((point: SpawnPoint) => {
        return point.name.toLowerCase().lastIndexOf(event.query.toLowerCase()) !== -1;
      });
    });
  }

  selectSpawnPoint(event) {
    this.spawnPoint = event;
  }

  saveReport(event) {
    if (this.form.valid) {
      let saveSub;
      if (this.paramReport && this.editingReport) {
        saveSub = this.nrService.editReport(this.paramReport.reportId, this.form.value, this.messageService);
      } else {
        saveSub = this.nrService.newReport(new NestReport(this.form.value), this.messageService);

        this.clearForm();
      }

      saveSub.subscribe(result => {
        window.setTimeout(() => {
          this.router.navigate(['reports']);
        }, 2500);
      });
    } else {
      this.messageService.add({ severity: 'warn', summary: '', detail: 'Chequea que los campos con (*) hayan sido rellenados.' });
    }
  }
}
