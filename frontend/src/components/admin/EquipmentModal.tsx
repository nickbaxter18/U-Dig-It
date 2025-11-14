'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Equipment {
  id: string;
  unitId: string;
  serialNumber: string;
  model: string;
  year: number;
  make: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  location: string;
  lastMaintenance?: string | Date;
  nextMaintenance?: string | Date;
  totalEngineHours?: number;
  specifications?: unknown;
}

interface EquipmentModalProps {
  equipment: Equipment | null;
  onSave: (equipment: Partial<Equipment>) => void;
  onClose: () => void;
}

export function EquipmentModal({ equipment, onSave, onClose }: EquipmentModalProps) {
  const [formData, setFormData] = useState({
    unitId: '',
    serialNumber: '',
    model: '',
    year: new Date().getFullYear(),
    make: 'Kubota',
    dailyRate: 450,
    weeklyRate: 2500,
    monthlyRate: 8000,
    status: 'AVAILABLE' as 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'OUT_OF_SERVICE',
    location: 'Main Yard',
    lastMaintenance: '',
    nextMaintenance: '',
    totalEngineHours: 0,
    specifications: {
      engine: '',
      horsepower: '',
      operatingWeight: '',
      bucketCapacity: '',
    },
  });

  useEffect(() => {
    if (equipment) {
      const specs = equipment.specifications as {
        engine?: string;
        horsepower?: string;
        operatingWeight?: string;
        bucketCapacity?: string;
      } | undefined;
      setFormData({
        unitId: equipment.unitId,
        serialNumber: equipment.serialNumber,
        model: equipment.model,
        year: equipment.year,
        make: equipment.make,
        dailyRate: equipment.dailyRate,
        weeklyRate: equipment.weeklyRate,
        monthlyRate: equipment.monthlyRate,
        status: (equipment.status || 'AVAILABLE').toUpperCase() as
          | 'AVAILABLE'
          | 'RENTED'
          | 'MAINTENANCE'
          | 'OUT_OF_SERVICE',
        location: equipment.location,
        lastMaintenance:
          equipment.lastMaintenance instanceof Date
            ? equipment.lastMaintenance.toISOString().slice(0, 10)
            : equipment.lastMaintenance || '',
        nextMaintenance:
          equipment.nextMaintenance instanceof Date
            ? equipment.nextMaintenance.toISOString().slice(0, 10)
            : equipment.nextMaintenance || '',
        totalEngineHours: equipment.totalEngineHours || 0,
        specifications: {
          engine: specs?.engine || '',
          horsepower: specs?.horsepower || '',
          operatingWeight: specs?.operatingWeight || '',
          bucketCapacity: specs?.bucketCapacity || '',
        },
      });
    }
  }, [equipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const equipmentData = {
      ...formData,
      lastMaintenance: formData.lastMaintenance || undefined,
      nextMaintenance: formData.nextMaintenance || undefined,
      totalEngineHours: formData.totalEngineHours || undefined,
    };

    onSave(equipmentData);
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSpecificationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [field]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative top-20 mx-auto w-11/12 max-w-4xl rounded-md border bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {equipment ? 'Edit Equipment' : 'Add New Equipment'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Basic Information</h4>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Unit ID *</label>
                <input
                  type="text"
                  required
                  value={formData.unitId}
                  onChange={e => handleInputChange('unitId', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="e.g., SVL75-001"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Serial Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.serialNumber}
                  onChange={e => handleInputChange('serialNumber', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="e.g., KUBOTA-SVL75-2025-001"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Make *</label>
                <input
                  type="text"
                  required
                  value={formData.make}
                  onChange={e => handleInputChange('make', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Model *</label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={e => handleInputChange('model', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="e.g., SVL-75-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Year *</label>
                <input
                  type="number"
                  required
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={e => handleInputChange('year', parseInt(e.target.value))}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Location *</label>
                <select
                  required
                  value={formData.location}
                  onChange={e => handleInputChange('location', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                >
                  <option value="Main Yard">Main Yard</option>
                  <option value="Service Bay">Service Bay</option>
                  <option value="Repair Shop">Repair Shop</option>
                  <option value="Job Site A">Job Site A</option>
                  <option value="Job Site B">Job Site B</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={e => handleInputChange('status', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RENTED">Rented</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Pricing</h4>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Daily Rate *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.dailyRate}
                  onChange={e => handleInputChange('dailyRate', parseFloat(e.target.value))}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Weekly Rate *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.weeklyRate}
                  onChange={e => handleInputChange('weeklyRate', parseFloat(e.target.value))}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Monthly Rate *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.monthlyRate}
                  onChange={e => handleInputChange('monthlyRate', parseFloat(e.target.value))}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Total Engine Hours
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalEngineHours}
                  onChange={e => handleInputChange('totalEngineHours', parseInt(e.target.value))}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last Maintenance
                </label>
                <input
                  type="date"
                  value={formData.lastMaintenance}
                  onChange={e => handleInputChange('lastMaintenance', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Next Maintenance Due
                </label>
                <input
                  type="date"
                  value={formData.nextMaintenance}
                  onChange={e => handleInputChange('nextMaintenance', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Specifications</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Engine</label>
                <input
                  type="text"
                  value={formData.specifications.engine || ''}
                  onChange={e => handleSpecificationChange('engine', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="e.g., Kubota V3800-CR-TE4"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Horsepower</label>
                <input
                  type="text"
                  value={formData.specifications.horsepower || ''}
                  onChange={e => handleSpecificationChange('horsepower', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="e.g., 74.3 HP"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Operating Weight
                </label>
                <input
                  type="text"
                  value={formData.specifications.operatingWeight || ''}
                  onChange={e => handleSpecificationChange('operatingWeight', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="e.g., 8,818 lbs"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bucket Capacity
                </label>
                <input
                  type="text"
                  value={formData.specifications.bucketCapacity || ''}
                  onChange={e => handleSpecificationChange('bucketCapacity', e.target.value)}
                  className="focus:ring-kubota-orange w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="e.g., 1.25 cu yd"
                />
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-kubota-orange rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              {equipment ? 'Update Equipment' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
